const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class BanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'ban',
			aliases: ['kickban'],
			description: "Bans the user",
			
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
		let canBan = false;
		for (let roleId of process.env.BAN_ROLES.split(',')) {
			if (msg.member.roles.has(roleId)) {
				canBan = true;
			}
		}
		if (!canBan) {
			return msg.reply("You do not have permission to use this command");
		}
		
		args.reason = args.reason.join(' ');
		
		let banuser = await Person.new(args.user.id);
		if (!banuser) {
			return msg.reply("An error has occured");
		}

		if (banuser.isModerator()) {
			return msg.reply("That user can't be kicked");
		}
		
		banuser.kick(args.reason, msg.member.id, true, msg.channel);
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
