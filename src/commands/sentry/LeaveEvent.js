/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class LeaveEventCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'leave',
			aliases: [],
			description: "Leave event"
		});
	}

	async run(msg, args) {
		if (!Sentry.guild.roles.find('name', "Event Participant")) {
			return msg.reply("No event currently active.");
		}
		
		msg.member.removeRole(Sentry.guild.roles.find('name', "Event Participant"));
		msg.reply("Removed you from the event channel.");
	}
}
