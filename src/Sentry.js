const path = require('path');
const fs = require('fs');

const Discord = require('discord.js-commando');
const Datastore = require('nedb-promises');

const {time, sleep, IsValidAdvert} = require('./Util');
const AutoModerator = require('./AutoModerator.js');
const Person = require('./Person.js');

const ADVERT_REACTIONS = [
	'👍', 
	'❤', 
	'😂',
	'😯',
	'😢',
];

module.exports = 
class Sentry {
	constructor() {
		this.bot = new Discord.Client({
			unknownCommandResponse: false,
			commandPrefix: ';',
			owner: ['113691352327389188']
		});
		
		this.autoModerator = new AutoModerator(this.bot);
		
		this.db = new Datastore(path.join(__dirname, '../data/data.db'));
		this.db.load();
		
		// Events
		
		this.bot.on('message', message => this.autoModerator.processMessage(message));
		this.bot.on('messageUpdate', (oldMessage, newMessage) => this.autoModerator.processMessage(newMessage));
		this.bot.on('message', message => this.onMessage(message));
		this.bot.on('messageReactionAdd', this.onReactionAdd.bind(this));
		this.bot.on('ready', this.onReady.bind(this));
		
		// Register commands
		
		this.bot.registry
			.registerGroup('sentry', 'Sentry')
			.registerDefaultTypes()
			.registerDefaultGroups()
			.registerDefaultCommands({
                ping: false,
                commandState: false,
                prefix: false,
                help: false
            })
			.registerCommandsIn(path.join(__dirname, 'commands'));
		
		// Login
		
		this.bot.login(process.env.TOKEN);

		// Expire mutes interval
		setInterval(this.expireMutes.bind(this), 60000);
		
		// Request system
		this.csv = path.join(__dirname, "../data/on_duty.csv");
		this.IDs = [];
		this.lastrequests = {};
		try {
			this.IDs = fs.readFileSync(this.csv, {encoding: 'utf8'}).split(",");
			if (typeof this.IDs === "undefined" || !this.IDs) {
				this.IDs = [];
			}
		} catch (e) {}
		
		this.EventMessageId = '';
		
		////
		
		this.voiceMovements = {};
	}
	
	onReady() {
		this.guild = this.bot.guilds.get(process.env.GUILD_ID);
		this.logGuild = this.bot.guilds.get(process.env.LOG_GUILD_ID);

		this.hookUpLogEvents();

		console.log("Sentry is ready.");
	}

	async onMessage(newMessage) {
		// message.channel.overwritePermissions(message.author, {
		// 	SEND_MESSAGES: false
		// });

		// setTimeout(() => {
		// 	message.channel.overwritePermissions(message.author, {SEND_MESSAGES: null});
		// }, 5000);
		
		if (newMessage.channel.id === process.env.ADVERTISEMENT_CHANNEL) {
			let messages = await newMessage.channel.fetchMessages({limit: 100});
 			
 			let hasPostedRecently = false;
 			
 			messages.map(message => {
 				if (message.id !== newMessage.id && message.author.id === newMessage.author.id && (new Date()).getTime() - message.createdAt.getTime() < 2 * 60 * 60 * 1000) {
 					hasPostedRecently = true;
 				}
 			});
 			
 			let validAdvert = IsValidAdvert(newMessage.cleanContent);
 			if (!validAdvert || hasPostedRecently) {
 				newMessage.delete();
 				if (!hasPostedRecently) newMessage.author.send("Your advertisement must contain a roblox.com link.");
 				if (hasPostedRecently) newMessage.author.send("You may only post once every 2 hours in the advertisement channel.");
 			} else {
 				for (let emoji of ADVERT_REACTIONS) {
 					await newMessage.react(emoji);
 				}
 				
 				if (Math.random() > 0.95) {
 					newMessage.react('👺');
 				} else {
 					newMessage.react('😡');
 				}
 			}
		} else if (newMessage.channel.id === process.env.BRINGS_YOU_CHANNEL) {
			for (let messageWord of newMessage.cleanContent.split(' ')) {
				let isWordAllowed = false;
				for (let allowedWord of process.env.BRINGS_YOU_WORDS.split(',')) {
					if (messageWord.toLowerCase().replace(/\W/g, '') === allowedWord) {
						isWordAllowed = true;
					}
				}

				if (!isWordAllowed) {
					newMessage.delete();
					break;
				}
			}
			
		}
	}

	async onReactionAdd(reaction, user) {
		let reactor = await Person.new(user.id);
		if (!reactor) return;
		
		if (reaction.emoji.name === '✅' && reaction.message.id === Sentry.EventMessageId) {
			reactor.member.addRole(this.guild.roles.find('name', "Event Participant"));
		}

		if (!reactor.isModerator()) {
			return;
		}

		let person = await Person.new(reaction.message.author.id);
		if (!person) return;

		if (reaction.emoji.id === process.env.MUTE_EMOJI) {
			reaction.message.delete();
			person.mute({ text: `Inappropriate (#${reaction.message.channel.name}):`, evidence: reaction.message.cleanContent }, reactor.id, reaction.message.channel);
		} else if (reaction.emoji.id === process.env.WARN_MOJI) {
			reaction.message.delete();
			person.warn({ text: `Please read #rules! You have been warned by a moderator (#${reaction.message.channel.name}):`, evidence: reaction.message.cleanContent }, reactor.id, reaction.message.channel);
		} else if (reaction.emoji.id === process.env.MUTE_CONTEXT_EMOJI) {
 			let messages = await reaction.message.channel.fetchMessages({limit: 35});
 			messages = messages.filter(message => {
 				return message.author.id === reaction.message.author.id;
 			});
 			let evidence = [];
 			for (let message of messages.array().reverse()) {
 				evidence.push(message.cleanContent);
 				
 				if (evidence.join('\n').length > 1000) break;
 			}
 			reaction.message.delete();
 			person.mute({ text: `Inappropriate (#${reaction.message.channel.name}):`, evidence: evidence.join('\n') }, reactor.id, reaction.message.channel);
		} else if (reaction.emoji.id === process.env.CLEAR_EMOJI) {
			let messages = await reaction.message.channel.fetchMessages({limit: 100});
 			reaction.message.channel.bulkDelete(messages.filter(message => {
 				return message.author.id === reaction.message.author.id;
 			}));
		}
	}

	async expireMutes() {
		let documents = await this.db.find({ muted: { $lte: time() } });

		if (documents !== null) {
			for (let document of documents) {
				let person = await Person.new(document.id);
				if (person && await person.isMuted()) await person.unmute(this.bot.user.id, false);
			}
		}
		
		documents = await this.db.find({ voice_muted: { $lte: time() } });

		if (documents !== null) {
			for (let document of documents) {
				let person = await Person.new(document.id);
				if (person) await person.unVoiceMute(this.bot.user.id, false);
			}
		}
	}

	async log(action, channel) {
		let logChannel = process.env.LOG_MUTES;
		
		action.username = "*no name*";
		if (!action.fields) action.fields = [];
		
		let user = await Person.new(action.id);
		if (user) action.username = user.member.displayName;
		
		let mod = await Person.new(action.modId);
		if (mod) action.modname = mod.member.displayName;
		if (action.modId === this.bot.user.id) action.modname = "Sentry";
		
		switch (action.type) {
			case "mute":
				action.color = 0xE74C3C;
				action.title = `<${action.username}> has been muted`;
				action.icon  = "http://i.imgur.com/yJFp4bQ.png";
				break;
			case "muteVoice":
				action.color = 0xF1C40F;
				action.title = `<${action.username}> has been voice-muted`;
				action.icon  = "http://i.imgur.com/7B2vj52.png";
				break;
			case "muteRemove":
				action.color = 0xf39c12;
				action.title = `Mute removed from history of <${action.username}>`;
				action.icon  = "http://i.imgur.com/A3RCsrj.png";
				break;
			case "muteRemoveAll":
				action.color = 0xf39c12;
				action.title = `Mute history cleared: <${action.username}>`;
				action.icon  = "http://i.imgur.com/fTuaven.png";
				break;
			case "unmuteManual":
				action.color = 0x2ECC71;
				action.title = `<${action.username}> has been unmuted`;
				action.icon  = "http://i.imgur.com/qAYTZsm.png";
				break;
			case "kick":
				logChannel = process.env.LOG_KICKS;
				action.color = 0xECF0F1;
				action.title = `User kicked: <${action.username}>`;
				action.icon = "https://i.imgur.com/1Ei8mgm.png";
				break;
			case "ban":
				logChannel = process.env.LOG_KICKS;
				action.color = 0xECF0F1;
				action.title = `User banned: <${action.username}>`;
				action.icon = "http://i.imgur.com/o9VorPw.png";
				break;
			case "warn":
				action.color = 0xFF9000;
				action.title = `User warned: <${action.username}>`;
				action.icon = "http://i.imgur.com/YtSakNq.png";
				break;
		}
		
		action.fields.push({ name: "Discord ID", value: action.id });
		action.fields.push({ name: "Name", value: action.username });
		action.fields.push({ name: "Moderator ID", value: action.modId });
		action.fields.push({ name: "Moderator", value: action.modname });
		
		for (let field of action.fields) {
			field.inline = true;
		}
		
		let embed = {
			title: action.title,
			color: action.color,
			description: action.reason || action.type,
			timestamp: new Date(),
			fields: action.fields,
			thumbnail: { url: action.icon }
		};
		
		this.logGuild.channels.get(logChannel).send({embed});
		
		if (channel && channel.id === process.env.STAFF_COMMANDS_CHANNEL) {
			channel.send({embed});
		}
	}
	
	async registerVoiceMovement(id) {
		if (typeof this.voiceMovements[id] === 'undefined') {
			this.voiceMovements[id] = [];
		}
		
		this.voiceMovements[id].push(time());
		
		let numRecentMoves = 0;
		for (let moveTime of this.voiceMovements[id]) {
			if (time() - moveTime < 5000) {
				numRecentMoves++;
			}
		}
		
		if (numRecentMoves > 5) {
			this.voiceMovements[id] = [];
			
			let person = await Person.new(id);
			if (!person) return;
			
			person.mute("You are moving voice channels too quickly!", this.bot.user.id)
		}
	}

	hookUpLogEvents() {
		this.bot.on('guildMemberAdd', member => {
			this.logGuild.channels.get(process.env.LOG_JOIN).send(`**Joined:** <@${member.user.id}>`).catch(()=>{});
		});

		this.bot.on('guildMemberRemove', member => {
			this.logGuild.channels.get(process.env.LOG_JOIN).send(`**Left:** <@${member.user.id}>`).catch(()=>{});
		});

		this.bot.on('voiceStateUpdate', (oldMember, newMember) => {
			let message = "";
			if (oldMember.voiceChannel && !newMember.voiceChannel) {
				try {
					newMember.guild.channels.get(process.env.VOICE_TEXT_CHANNEL).permissionOverwrites.get(newMember.id).delete();
				} catch (e) {}
				message = `**${newMember.displayName}** leaves <#${oldMember.voiceChannelID}>`;
			} else if (!oldMember.voiceChannel && newMember.voiceChannel) {
				newMember.guild.channels.get(process.env.VOICE_TEXT_CHANNEL).overwritePermissions(newMember.id, { READ_MESSAGES: true });

				message = `**${newMember.displayName}** joins <#${newMember.voiceChannelID}>`;
			} else if (oldMember.voiceChannel && newMember.voiceChannel && oldMember.voiceChannelID !== newMember.voiceChannelID) {
				message = `**${newMember.displayName}** moves to <#${newMember.voiceChannelID}>`;
			}

			this.logGuild.channels.get(process.env.LOG_VOICE).send(message).catch(()=>{});
			
			for (let channelId of process.env.IGNORE_VOICE_CHANNELS.split(',')) {
				if (channelId === newMember.voiceChannelID) {
					return;
				}
			}

			if (newMember.voiceChannel && message !== "") {
				(async function() {
					let person = await Person.new(newMember.user.id);
					if (!person) return;
					
					person.member.setMute(await person.isVoiceMuted());
				})();
			}
			
			if (message !== "") {
				this.registerVoiceMovement(newMember.user.id);
			}
		});

		this.bot.on('messageDelete', message => {
			this.logGuild.channels.get(process.env.LOG_CHAT).send({embed:{
				color: 0xe74c3c,
				timestamp: new Date(),
				title: "Message Deleted",
				fields: [
					{
						name: "User",
						inline: true,
						value: message.member !== null ? message.member.displayName : message.author.username + (message.author.bot ? " [BOT]" : "")
					},
					{
						name: "Channel",
						inline: true,
						value: `<#${message.channel.id}>`
					},
					{
						name: "Message",
						value: message.cleanContent
					}
				]
			}}).catch(()=>{});
		});

		this.bot.on('messageUpdate', (oldMessage, newMessage) => {
			if (!newMessage.member || !newMessage.member.displayName) {
				return;
			}
			if (newMessage.cleanContent === oldMessage.cleanContent) {
				return;
			}
			
			if (oldMessage.channel.id === process.env.ADVERTISEMENT_CHANNEL && !IsValidAdvert(newMessage.cleanContent)) newMessage.delete();

			if (oldMessage.channel.id === process.env.BRINGS_YOU_CHANNEL) return oldMessage.delete();
			
			this.logGuild.channels.get(process.env.LOG_CHAT).send({embed:{
				color: 0xf1c40f,
				timestamp: new Date(),
				title: "Message Updated",
				fields: [
					{
						name: "User",
						inline: true,
						value: !newMessage.author.bot ? newMessage.member.displayName : newMessage.author.username + " [BOT]"
					},
					{
						name: "Channel",
						inline: true,
						value: `<#${newMessage.channel.id}>`
					},
					{
						name: "Before",
						value: oldMessage.cleanContent
					},
					{
						name: "After",
						value: newMessage.cleanContent
					}
				]
			}}).catch(()=>{});
		});
	}
	
	setEventAnnouncementMessage(id) {
		Sentry.EventMessageId = id;
	}
}
