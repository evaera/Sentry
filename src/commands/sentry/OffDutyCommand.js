/* global Sentry */
const Command = require('../Command');
const Person = require('../../Person.js');
const fs = require('fs');
const path = require('path');

module.exports =
class OffDutyCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'offduty',
			aliases: [],
			description: "Marks yourself as off-duty",
		});
	}

	async run(msg, args) {
		try {
			if (Sentry.IDs.includes(msg.author.id)) {
				Sentry.IDs.splice(Sentry.IDs.indexOf(msg.author.id), 1)
				fs.writeFileSync(Sentry.csv, Sentry.IDs.join(","));
				
				msg.reply("you are no longer on duty.");
			} else { 
				msg.reply("you are not on duty!");
			}
		} catch(e) {
			msg.reply(`there was an error while marking you as off duty. ${e}`)
		}
			
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
