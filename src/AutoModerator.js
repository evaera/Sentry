const filter = require('../data/filter.json');
const fs = require('fs');
const path = require('path');
const {time} = require('./Util');
const VaeBotUtil = require('./VaeBotUtil');
const Person = require('./Person.js');

const ignoreRoles = [
	"360561922061500417", // Server Moderator
	"360552153078824962", // Bot
	"219302502867271690", // Bot Bypass
];

const ignoreChannels = [
	"150075910341525504", // some random channel eryn didn't bother to describe
	"150250250471342080" // this one too
];

module.exports = 
class AutoModerator {
	constructor(bot) {
		this.bot = bot;
		this.lastMessage = {};
		this.messageTimes = {};

		setTimeout(() => {
			this.lastMessage = {};
			this.messageTimes = {};
		}, 6 * 60 * 60 * 1000);
	}
	
	async checkTooFast(author, message) {
		if (this.messageTimes[author] == undefined) {
			this.messageTimes[author] = [];
		}
		
		this.messageTimes[author].push(time());
		while (this.messageTimes[author].length > 10) {
			this.messageTimes[author].shift();
		}
		
		if (this.messageTimes[author].length === 10 && time() - this.messageTimes[author][0] >= 5000) {
			let mute = true;
			
			for (let timestamp of this.messageTimes[author]) {
				if (time() - timestamp > 10000) {
					mute = false;
				}
			}
			
			if (mute) {
				let person = await Person.new(author);
				person.mute("Automatic Spam Detection:\nYou are sending messages too quickly! (more than 10 messages in 10 seconds!)", Sentry.bot.user.id);
				this.messageTimes[author] = [];
			}
		}
	}
	
	async checkSpamMessage(author, message) {
		let id = `${author}~${message.cleanContent}`;
		
		if (this.lastMessage[id] != undefined && this.lastMessage[id].text === message.cleanContent && time() - this.lastMessage[id].time < 15000) {
			this.lastMessage[id].times++;
			
			if (this.lastMessage[id].times >= 5) {
				let person = await Person.new(author);
				person.mute({text: "Automatic Spam Detection:", evidence: this.lastMessage[id].text}, Sentry.bot.user.id, message.channel);
				
				for (let key of Object.keys(this.lastMessage)) {
					if (key.match(/^(\d+)~/)[1] === author) {
						delete this.lastMessage[key];
					}
				}
			}
		} else {
			this.lastMessage[id] = {
				text: message.cleanContent,
				times: 1,
				time: time()
			}
		}
	}
	
	checkFilter(message) {
		for (let sequence of filter.anywhere) {
			if (message.cleanContent.toLowerCase().includes(sequence.toLowerCase())) {
				return true;
			}
		}
	
		let words = message.cleanContent.split(' ');
		for (let word of words) {
			for (let badWord of filter.words) {
				if (word.toLowerCase().replace(/\W/g, '') === badWord.toLowerCase()) {
					return true;
				}
			}
		}
	
		return false;
	}
	
	writeFilter() {
		fs.writeFile(path.join(__dirname, "..", "data", "filter.json"), JSON.stringify(filter), () => {});
	}
	
	processCommand(message) {
		let args = message.cleanContent.split(' ');
		let command = args.shift();
		let predicate = args.join(' ');
	
		switch(command) {
			case "anywhere":
				filter.anywhere.push(predicate);
				message.reply(`Added \`${predicate}\` to list *anywhere*.`);
				this.writeFilter();
				break;
			case "word":
				filter.words.push(predicate);
				message.reply(`Added \`${predicate}\` to list *words*.`);
				this.writeFilter();
				break;
			case "dump":
				let output = "***FILTER***\n\n**Anywhere**\n\n";
				for (let word of filter.anywhere) {
					output += `\`${word}\`\n`;
				}
				output += "\n**Words**\n\n";
				for (let word of filter.words) {
					output += `\`${word}\`\n`;
				}
				message.channel.send(output, {split: true});
				break;
			case "remove":
				if (filter.anywhere.indexOf(predicate) > -1) {
					filter.anywhere.splice(filter.anywhere.indexOf(predicate), 1);
				}
	
				if (filter.words.indexOf(predicate) > -1) {
					filter.words.splice(filter.words.indexOf(predicate), 1);
				}
	
				this.writeFilter();
	
				message.reply(`Removed word \`${predicate}\` from both lists.`);
				break;
		}
	}
	
	async processMessage(message) {
		let author = message.author.id;
		
		if (!message.guild && (author === process.env.OWNER_ID || author === "242727621518032896")) {
			this.processCommand(message);
		}

		if (message.channel.id === '360554284661604352') { // verify channel
			setTimeout( () => {
				message.delete();
			}, 1000);
		}
		
		if (author === this.bot.user.id || !message.guild) {
			return;
		}
		
		if (message.author.bot) return;
		if (!message.member) return;
	
		for (let role of ignoreRoles) {
			if (message.member.roles.has(role)) {
				return;
			}
		}
	
		for (let channel of ignoreChannels) {
			if (message.channel.id === channel) {
				return;
			}
		}
		
		this.checkTooFast(author, message);
		
		this.checkSpamMessage(author, message);
		
		let person = await Person.new(author);
		
		if (await person.isMuted()) {
			if (!message.member.roles.has(process.env.MUTED_ROLE)) {
			    message.member.addRole(process.env.MUTED_ROLE);
			}
			return message.delete();
		}
	
		// if (VaeBotUtil.isSpam(message.cleanContent)) {
		// 	person.mute({ text: "Automatic Spam Detection:\nSingle message", evidence: message.cleanContent.substring(0, 200)}, Sentry.bot.user.id, message.channel);
		// }

		// if (message.cleanContent.replace(/(discord\.gg\/roblox)/ig, '').match(/discord\.gg\//i)) {
		// 	person.mute({ text: "Breaking rule #13", evidence: message.cleanContent.substring(0, 200)}, Sentry.bot.user.id, message.channel);
		// 	return message.delete();
		// }
	
		if (this.checkFilter(message)) {
			console.log(`${message.member.displayName}: ${message.cleanContent}`);
			return message.delete();
		}
	}
}
