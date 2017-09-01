const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class WarnCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'warn',
			aliases: [],
			description: "Warns ze user",
			
			args: [
				{
					key: 'user',
					prompt: 'The user to be warned:',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'Please enter a reason:',
					type: 'string',
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		args.reason = args.reason.join(' ');
		
		let person = await Person.new(args.user.id);
		if (!person) {
			return msg.reply("An error occurred");
		}
		
		person.warn(args.reason, msg.member.id, msg.channel);

		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
		
	}
}
