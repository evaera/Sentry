const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class UnmuteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'unmute',
			aliases: [],
			description: "Unmutes ze user",
			
			args: [
				{
					key: 'user',
					prompt: 'User',
					type: 'member'
				}
			]
		});
	}

	async run(msg, args) {
		let person = await Person.new(args.user.id);
		if (!person) {
			return msg.reply("An error occurred");
		}
		person.unmute(msg.member.id, true);
	}
}
