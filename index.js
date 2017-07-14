const Discord = require('discord.js');
const filter = require('./filter.json');

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
		if (message.cleanContent.includes(sequence)) {
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

bot.on('message', message => {
	if (!message.guild) {
		return;
	}
	
	let author = message.author.id;
	
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

	if (checkFilter(message)) {
		console.log(`${message.member.displayName}: ${message.cleanContent}`);
		message.delete();
	}
});

setTimeout(() => {
	lastMessage = {};
	messageTimes = {};
}, 6 * 60 * 60 * 1000); // 2.16e+7

bot.login('MjQwMDM3NzkxOTkwNDE1Mzcw.DEnGTQ.PYE7AF4F9_xDV3AT7Vbpfq0GUN8');
