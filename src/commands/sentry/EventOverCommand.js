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
		if (Sentry.guild.roles.find('name', "Event Participant")) {
			await Sentry.guild.roles.find('name', "Event Participant").delete();
		}
		
		let announceMessage = await Sentry.guild.channels.get(process.env.ANNOUNCEMENT_CHANNEL).send(`The event has ended. Thanks for participating!`);
		
		msg.reply("Event ended");
	}
}
 