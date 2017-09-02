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
		if (args.user.id === Sentry.bot.user.id) {
			return msg.reply("I have a clean record, thank you for your concern.");
		}
		
		let histUser = await Person.new(args.user.id);
		
		if (!histUser) {
			return msg.reply("An error has occured");
		}
			
		let muteHist = await histUser.getMuteHistory();
			
		let output = `***Mute history for user \`${args.user.id}\` (\`${args.user.displayName}\`)***\n\n`;
		output += `Currently ${await histUser.isMuted() ? 'global muted' : 'not global muted'}\n\n`;
		output += `Currently ${await histUser.isVoiceMuted() ? 'voice-muted:' : 'not voice-muted'}\n`;
		if (await histUser.isVoiceMuted()) {
			output += 'By ' + await histUser.getVoiceMuteReason() + '\n\n';
		}
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
			} else if (mute.warn && mute.warn === 1) {
				actionType = "Warned";
			}
				
			output += `${muteHist.indexOf(mute) + 1}. **${actionType}** on ${date.toString()}\n`;
				
			let muter = await Person.new(mute.who);
			let muterName = "*unknown*";
			if (muter) muterName = muter.member.displayName;
			if (mute.who === Sentry.bot.user.id) muterName = "Sentry [BOT]";
				
			if (actionType === "Muted") output += `Length: ${muteLength}\n`;
			output += `${actionType} by: \`${mute.who}\` (\`${muterName}\`)\n`;
			output += `Reason: \`\`\`\n${mute.reason.replace(/`/gm, '')}\n\`\`\`\n`;
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
