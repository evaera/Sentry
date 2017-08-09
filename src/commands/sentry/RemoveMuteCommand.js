const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class RemoveMuteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'removemute',
			aliases: [],
			description: "Removes a user's mute by ID",
			
			args: [
				{
					key: 'user',
					prompt: 'User:',
					type: 'member'
				}, 
				{
					key: 'muteId',
					prompt: 'Mute ID: ',
					type: 'integer'
				}
			]
		});
	}

	async run(msg, args) {
		if (msg.member.roles.has(process.env.TRIAL_MOD_ROLE)) { // trial moderator
			return msg.reply("You don't have permission to use this command. Please ask a Server Moderator to assist you.");
		}
		
		let user = await Person.new(args.user.id);
		if (!user) {
			msg.reply("An error has occured");
		}
		
		let mutes = await user.getMuteHistory();
		if (mutes && mutes.length >= args.muteId) {
			user.removeMute(args.muteId - 1, msg.author.id, msg.channel);
		} else {
			msg.reply("Invalid mute ID, make sure that you are using the number from their history.");
		}
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
