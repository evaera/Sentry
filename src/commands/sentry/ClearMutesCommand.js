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
		let user = await Person.new(args.user.id);
		if (!user) {
			msg.reply("An error has occured");
		}

		user.removeAllMutes(msg.author.id, msg.channel)
		
		msg.delete();
	}
}
