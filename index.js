const Discord = require('discord.js');

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

bot.on('message', message => {
	if (!message.guild) {
		return;
	}
	
	let author = message.author.id;
	
	if (author === bot.user.id || author === "240413107850182656") {
		return;
	}
	
	checkTooFast(author, message);
	
	checkSpamMessage(author, message);
});

setTimeout(() => {
	lastMessage = {};
	messageTimes = {};
}, 6 * 60 * 60 * 1000); // 2.16e+7

bot.login('MjQwMDM3NzkxOTkwNDE1Mzcw.DEkwUA.vTzQOrDNSc0Y5JVNNVpFE1kq92k');
