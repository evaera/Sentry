const Discord = require('discord.js');
const filter = require('./filter.json');
const fs = require('fs');
const path = require('path');

const VaeBotUtil = require('./VaeBotUtil');

const ignoreRoles = [
	"150093661231775744", // Server Moderator
	"150075195971862528", // Bot
	"219302502867271690", // Bot Bypass
];

const bot = new Discord.Client();

const time = () => (new Date()).getTime();

const lastMessage = {};
const messageTimes = {};

function checkTooFast(author, message) {
	if (messageTimes[author] == undefined) {
		messageTimes[author] = [];
	}
	
	messageTimes[author].push(time());
	while (messageTimes[author].length > 10) {
		messageTimes[author].shift();
	}
	
	if (messageTimes[author].length === 10 && time() - messageTimes[author][0] >= 5000) {
		let mute = true;
		
		for (let timestamp of messageTimes[author]) {
			if (time() - timestamp > 10000) {
				mute = false;
			}
		}
		
		if (mute) {
			message.channel.send(`;mute ${author} [Automated System Mute] You are sending messages too quickly! (more than 10 messages in 10 seconds!)`);
			messageTimes[author] = [];
		}
	}
}

function checkSpamMessage(author, message) {
	let id = `${author}~${message.cleanContent}`;
	
	if (lastMessage[id] != undefined && lastMessage[id].text === message.cleanContent && time() - lastMessage[id].time < 15000) {
		lastMessage[id].times++;
		
		if (lastMessage[id].times >= 5) {
			message.channel.send(`;mute ${author} [Automated System Mute] Spamming \`${lastMessage[id].text}\``);
			
			for (let key of Object.keys(lastMessage)) {
				if (key.match(/^(\d+)~/)[1] === author) {
					delete lastMessage[key];
				}
			}
		}
	} else {
		lastMessage[id] = {
			text: message.cleanContent,
			times: 1,
			time: time()
		}
	}
}

function checkFilter(message) {
	for (let sequence of filter.anywhere) {
		if (message.cleanContent.toLowerCase().includes(sequence.toLowerCase())) {
			return true;
		}
	}

	let words = message.cleanContent.split(' ');
	for (let word of words) {
		for (let badWord of filter.words) {
			if (word.toLowerCase().replace(/\W/g, '') === badWord.toLowerCase()) {
				return true;
			}
		}
	}

	return false;
}

function writeFilter() {
	fs.writeFile(path.join(__dirname, "filter.json"), JSON.stringify(filter), () => {});
}

function processCommand(message) {
	let args = message.cleanContent.split(' ');
	let command = args.shift();
	let predicate = args.join(' ');

	switch(command) {
		case "anywhere":
			filter.anywhere.push(predicate);
			message.reply(`Added \`${predicate}\` to list *anywhere*.`);
			writeFilter();
			break;
		case "word":
			filter.words.push(predicate);
			message.reply(`Added \`${predicate}\` to list *anywhere*.`);
			writeFilter();
			break;
		case "dump":
			let output = "***FILTER***\n\n**Anywhere**\n\n";
			for (let word of filter.anywhere) {
				output += `\`${word}\`\n`;
			}
			output += "\n**Words**\n\n";
			for (let word of filter.words) {
				output += `\`${word}\`\n`;
			}
			message.channel.send(output, {split: true});
			break;
		case "remove":
			if (filter.anywhere.indexOf(predicate) > -1) {
				filter.anywhere.splice(filter.anywhere.indexOf(predicate), 1);
			}

			if (filter.words.indexOf(predicate) > -1) {
				filter.words.splice(filter.words.indexOf(predicate), 1);
			}

			writeFilter();

			message.reply(`Removed word \`${predicate}\` from both lists.`);
			break;
	}
}

function processMessage(message) {
	let author = message.author.id;

	if (!message.guild) {
		if (author === "113691352327389188") {
			processCommand(message);
		}

		return;
	}
	
	if (author === bot.user.id) {
		return;
	}

	for (let role of ignoreRoles) {
		if (message.member.roles.has(role)) {
			return;
		}
	}
	
	checkTooFast(author, message);
	
	checkSpamMessage(author, message);

	if (VaeBotUtil.isSpam(message.cleanContent)) {
		message.channel.send(`;mute ${message.author.id} Spamming \`${message.cleanContent.substring(0, 200)}\``)
	}

	if (checkFilter(message)) {
		console.log(`${message.member.displayName}: ${message.cleanContent}`);
		message.delete();
	}
}

bot.on('message', processMessage);
bot.on('messageUpdate', (oldMessage, newMessage) => processMessage(newMessage));

setTimeout(() => {
	lastMessage = {};
	messageTimes = {};
}, 6 * 60 * 60 * 1000);

if (fs.existsSync('DEVELOPMENT')) {
	bot.login('MjA3NzM0OTc4MTQwODMxNzQ0.DEq36g.pcpfq__--gBtEvvsaSaiVI8pYH4');
} else {
	bot.login('MjQwMDM3NzkxOTkwNDE1Mzcw.DEnGTQ.PYE7AF4F9_xDV3AT7Vbpfq0GUN8');
}