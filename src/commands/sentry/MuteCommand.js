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
					prompt: 'The user to be muted:',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'Please enter a reason:',
					type: 'string'
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
			return msg.author.send(`\`${args.user.displayName}\` is already muted!`);
		}
		
		person.mute(args.reason, msg.member.id, msg.channel);

		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}

		if (args.reason.includes("http://") === false && args.reason.includes("https://") === false) {
			msg.author.send(`You have muted ${person.member.displayName} without evidence!`);
		}
		
	}
}
