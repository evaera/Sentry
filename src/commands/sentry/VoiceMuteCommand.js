const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class VoiceMuteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'voicemute',
			aliases: ["vmute"],
			description: "Voice mutes the user",
			
			args: [
				{
					key: 'user',
					prompt: 'User',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'Reason',
					type: 'string',
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		args.reason = args.reason.join(' ');
		
		msg.reply(`Voice muting ${args.user} for ${args.reason}`);
		
		let person = await Person.new(args.user.id);
		if (!person) {
			return msg.reply("An error occurred");
		}
		person.voiceMute(args.reason, msg.member.id, msg.channel);

		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
