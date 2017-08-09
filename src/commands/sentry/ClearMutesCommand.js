const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class ClearMutesCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'clearmutes',
			aliases: ['clrmutes'],
			description: "Clears all of the user's mutes",
			
			args: [
				{
					key: 'user',
					prompt: 'User:',
					type: 'member'
				}
			]
		});
	}

	async run(msg, args) {
		if (msg.member.roles.has(process.env.TRIAL_MOD_ROLE)) { // trial moderator
			return msg.reply("You don't have permission to use this command.");
		}

		let user = await Person.new(args.user.id);
		if (!user) {
			msg.reply("An error has occured");
		}

		user.removeAllMutes(msg.author.id, msg.channel)
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
