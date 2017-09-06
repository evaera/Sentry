/*global Sentry*/

const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class EventCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'event',
			aliases: [],
			description: "Event channel",
			
			args: [
				{
					key: 'name',
					prompt: 'Event announcement:',
					type: 'string',
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		if (msg.member.roles.has(process.env.TRIAL_MOD_ROLE)) { // trial moderator
			return msg.reply("You don't have permission to use this command. Please ask a Server Moderator to assist you.");
		}
		
		args.name = args.name.join(' ');
		
		if (Sentry.guild.roles.find('name', "Event Participant")) {
			await Sentry.guild.roles.find('name', "Event Participant").delete();
		}
		
		let participantRole = await Sentry.guild.createRole({ data: { name: "Event Participant" } });
		
		Sentry.guild.channels.get(process.env.EVENT_CHANNEL).overwritePermissions(participantRole, { 'READ_MESSAGES': true });
		
		let announceMessage = await Sentry.guild.channels.get(process.env.ANNOUNCEMENT_CHANNEL).send(`@everyone ${args.name}\n\nClick the reaction below to join in on the event! You can also use the \`;join\` or \`;leave\` commands.`);
		await announceMessage.react('✅');
		
		Sentry.setEventAnnouncementMessage(announceMessage.id);
		
		msg.reply("Event started");
	}
}
