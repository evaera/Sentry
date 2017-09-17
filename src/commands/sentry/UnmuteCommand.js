const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class UnmuteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unmute',
			aliases: ['allowtospeak'],
			description: "Unmutes ze user",
			
			args: [
				{
					key: 'user',
					prompt: 'User',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'Please specify the reason for unmute (will be saved in history)',
					type: 'string',
					default: 'None'
				}
			]
		});
	}

	async run(msg, args) {
		// args.reason = args.reason.join(' ');
		
		let person = await Person.new(args.user.id);
		if (!person) {
			return msg.reply("An error occurred");
		}
		if (await person.isMuted()) {
			person.unmute(msg.member.id, true, msg.channel, `********************************\n\nUnmuted by ${msg.member.displayName}: ${args.reason}`);
			if (await person.isVoiceMuted()) person.unVoiceMute();
		} else if (await person.isVoiceMuted()) {
			person.unVoiceMute();
			msg.reply("Removed voice mute from user.");
		} else {
			msg.reply("That user isn't muted.");
		}
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
