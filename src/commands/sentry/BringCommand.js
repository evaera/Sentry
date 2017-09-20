/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class BringCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'bring',
			aliases: ['vbring', 'bringvoice'],
			description: "Bring a user",
			
			args: [
				{
					key: 'user',
					prompt: 'User to bring:',
					type: 'member'
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.member.voiceChannel) {
			return msg.reply("Join a voice channel before using this command");
		}
		
		if (!args.user.voiceChannel) {
			return msg.reply("Target user isn't in a voice channel yet");
		}
		
		args.user.setVoiceChannel(msg.member.voiceChannel);
		msg.reply(`Brought user to ${msg.member.voiceChannel}`);
		Sentry.logGuild.channels.get(process.env.LOG_VOICE).send(`**${msg.member.displayName}** brings **${args.user.displayName}** to ${msg.member.voiceChannel}`).catch(()=>{});
	}
}
