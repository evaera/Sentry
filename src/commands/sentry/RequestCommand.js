/* global Sentry */
const Command = require('../Command');
const Person = require('../../Person.js');
const fs = require('fs');
const path = require('path');

module.exports =
class RequestCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'request',
			aliases: ['requeststaff', 'requestadmin', 'requestmod'],
			description: "Calls for an on duty admin",
		});
	}

	async run(msg, args) {
		try {
			if (!Sentry.lastrequests[msg.channel.id] || new Date().getTime() - Sentry.lastrequests[msg.channel.id] > 5 * 60 * 1000) {
				Sentry.lastrequests[msg.channel.id] = new Date().getTime();
				
				msg.reply(`${Sentry.IDs.length-1} staff member(s) were notified.`);
				
				let notifystring = "";
				Sentry.IDs.map(e => { if (e != '') notifystring += `<@${e}> `}); //thx eryn
				notifystring += `| ${msg.member.nickname} requested a mod in #${msg.channel.name}`;
				
				msg.guild.channels.get(process.env.STAFF_COMMANDS_CHANNEL).send(notifystring);
			} else { 
				msg.reply("this channel has a cooldown, please wait before calling a staff member.");
			}
			
		} catch(e) {
			msg.reply(`there was an error: ${e}`);
		}
	}
}
