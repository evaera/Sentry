/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class JoinChannelCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'to',
			aliases: ['vjoin', 'joinvoice'],
			description: "Join a voice channel",
			
			args: [
				{
					key: 'channel',
					prompt: 'Channel to move to:',
					type: 'channel'
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.member.voiceChannel) {
			return msg.reply("Join a voice channel before using this command");
		}
		
		msg.member.setVoiceChannel(args.channel);
		msg.reply(`Moved you to ${args.channel}`);
	}
}
