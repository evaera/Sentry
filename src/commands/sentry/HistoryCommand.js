const Command = require('../Command');
const Person = require('../../Person.js');

module.exports =
class HistoryCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'history',
			aliases: ['mutes'],
			description: "Check user's history",
			
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
		if (msg.member.roles.has('218513797659230209')) { // trial moderator
			return msg.reply("You don't have permission to use this command. Please ask a Server Moderator to assist you.");
		}

		let histUser = await Person.new(args.user.id);
		if (!histUser) {
			msg.reply("An error has occured");
		}
			
		let muteHist = await histUser.getMuteHistory();
			
		let output = `***Mute history for user \`${args.user.id}\` (\`${args.user.displayName}\`)***\n\n`;
		output += `Currently ${await histUser.isMuted() ? 'global muted' : 'not global muted'}\n\n`;
		output += `Currently ${await histUser.isVoiceMuted() ? 'voice-muted' : 'not voice-muted'}\n`;
		output += `${await histUser.numVoiceMutes()} previous voice-mutes\n\n`;
			
		for (let mute of muteHist) {
			let date = new Date();
			date.setTime(mute.date);
				
			let muteLength = "";
			if (mute.len / 60 / 60 / 24 / 1000 > 1) {
				muteLength = `${(mute.len / 60 / 60 / 24 /  1000).toFixed(2)} days`;
			} else {
				muteLength = `${(mute.len / 60 / 60 / 1000).toFixed(2)} hours`;
			}
				
			let actionType = "Muted";
			if (mute.kick && mute.kick === 1) {
				actionType = "Kicked";
			} else if (mute.kick && mute.kick === 2) {
				actionType = "Banned";
			}
				
			output += `${muteHist.indexOf(mute) + 1}. **${actionType}** on ${date.toString()}\n`;
				
			let muter = await Person.new(mute.who);
			let muterName = "*unknown*";
			if (muter) muterName = muter.member.displayName;
				
			output += `Length: ${muteLength}\n`;
			output += `Muted by: \`${mute.who}\` (\`${muterName}\`)\n`;
			output += `Reason: \`${mute.reason}\`\n`;
			output += `\n`;
			if (output.length > 1000) {
				msg.reply(output);
				output = ``;
			}
		}
			
		if (output.length > 0) {
			msg.reply(output);
		}
		
		if (msg.channel.id !== process.env.STAFF_COMMANDS_CHANNEL) {
			msg.delete();
		}
	}
}
