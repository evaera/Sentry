const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class MuteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'mute',
			aliases: [],
			description: "Mutes ze user",
			
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
		
		msg.reply(`Muting ${args.user} for ${args.reason}`);
		
		let person = await Person.new(args.user.id);
		person.mute(args.reason, msg.member.id);
	}
}
