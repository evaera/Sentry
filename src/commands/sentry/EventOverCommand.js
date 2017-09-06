/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class EventOverCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'eventover',
			aliases: [],
			description: "Event over"
		});
	}

	async run(msg, args) {
		if (msg.member.roles.has(process.env.TRIAL_MOD_ROLE)) { // trial moderator
			return msg.reply("You don't have permission to use this command. Please ask a Server Moderator to assist you.");
		}
		
		if (Sentry.guild.roles.find('name', "Event Participant")) {
			await Sentry.guild.roles.find('name', "Event Participant").delete();
		}
		
		let announceMessage = await Sentry.guild.channels.get(process.env.ANNOUNCEMENT_CHANNEL).send(`The event has ended. Thanks for participating!`);
		
		msg.reply("Event ended");
	}
}
 