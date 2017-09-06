/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class JoinEventCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'join',
			aliases: [],
			description: "Join event"
		});
	}

	async run(msg, args) {
		if (!Sentry.guild.roles.find('name', "Event Participant")) {
			return msg.reply("No event currently active.");
		}
		
		msg.member.addRole(Sentry.guild.roles.find('name', "Event Participant"));
		msg.reply("Added you to the event channel.");
	}
}
