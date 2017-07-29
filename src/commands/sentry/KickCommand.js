const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class BanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'kick',
			aliases: [],
			description: "Kicks the user",
			
			args: [
				{
					key: 'user',
					prompt: 'User:',
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
		
		let kickuser = await Person.new(args.user.id);
		if (!kickuser) {
			return msg.reply("An error has occured");
		}
		
		if (kickuser.isModerator()) {
			return msg.reply("That user can't be kicked");
		}
		
		kickuser.kick(args.reason, msg.member.id, false, msg.channel);
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
