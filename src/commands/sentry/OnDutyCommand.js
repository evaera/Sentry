/* global Sentry */
const Command = require('../Command');
const Person = require('../../Person.js');
const fs = require('fs');
const path = require('path');

module.exports =
class OnDutyCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'onduty',
			aliases: [],
			description: "Marks yourself as on-duty",
		});
	}

	async run(msg, args) {
		try {
			if (!Sentry.IDs.includes(msg.author.id)) {
				Sentry.IDs.push(msg.author.id);
				fs.writeFileSync(Sentry.csv, Sentry.IDs.join(","));
				
				msg.reply("you were successfully marked as on duty!");
			} else { 
				msg.reply("you are already on duty!");
			}
		} catch(e) {
			msg.reply(`there was an error while marking you as on duty. ${e}`);
		}
			
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
