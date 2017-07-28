const filter = require('../data/filter.json');
const fs = require('fs');
const path = require('path');

const VaeBotUtil = require('./VaeBotUtil');

const ignoreRoles = [
	"150093661231775744", // Server Moderator
	"150075195971862528", // Bot
	"219302502867271690", // Bot Bypass
];

const ignoreChannels = [
	"150075910341525504", // some random channel eryn didn't bother to describe
	"150250250471342080" // this one too
];

const time = () => (new Date()).getTime();

module.exports = 
class AutoModerator {
	constructor(bot) {
		this.bot = bot;
		this.lastMessage = {};
		this.messageTimes = {};

		setTimeout(() => {
			this.lastMessage = {};
			this.messageTimes = {};
		}, 6 * 60 * 60 * 1000);
	}
	
	checkTooFast(author, message) {
		if (this.messageTimes[author] == undefined) {
			this.messageTimes[author] = [];
		}
		
		this.messageTimes[author].push(time());
		while (this.messageTimes[author].length > 10) {
			this.messageTimes[author].shift();
		}
		
		if (this.messageTimes[author].length === 10 && time() - this.messageTimes[author][0] >= 5000) {
			let mute = true;
			
			for (let timestamp of this.messageTimes[author]) {
				if (time() - timestamp > 10000) {
					mute = false;
				}
			}
			
			if (mute) {
				message.channel.send(`;mute ${author} [Automated System Mute] You are sending messages too quickly! (more than 10 messages in 10 seconds!)`);
				this.messageTimes[author] = [];
			}
		}
	}
	
	checkSpamMessage(author, message) {
		let id = `${author}~${message.cleanContent}`;
		
		if (this.lastMessage[id] != undefined && this.lastMessage[id].text === message.cleanContent && time() - this.lastMessage[id].time < 15000) {
			this.lastMessage[id].times++;
			
			if (this.lastMessage[id].times >= 5) {
				message.channel.send(`;mute ${author} [Automated System Mute] Spamming \`${this.lastMessage[id].text}\``);
				
				for (let key of Object.keys(this.lastMessage)) {
					if (key.match(/^(\d+)~/)[1] === author) {
						delete this.lastMessage[key];
					}
				}
			}
		} else {
			this.lastMessage[id] = {
				text: message.cleanContent,
				times: 1,
				time: time()
			}
		}
	}
	
	checkFilter(message) {
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
	
	processMessage(message) {
		let author = message.author.id;
		
		if (author === this.bot.user.id) {
			return;
		}
	
		for (let role of ignoreRoles) {
			if (message.member.roles.has(role)) {
				return;
			}
		}
	
		for (let channel of ignoreChannels) {
			if (message.channel.id === channel) {
				return;
			}
		}
		
		this.checkTooFast(author, message);
		
		this.checkSpamMessage(author, message);
	
		if (VaeBotUtil.isSpam(message.cleanContent)) {
			message.channel.send(`;mute ${message.author.id} Spamming \`${message.cleanContent.substring(0, 200)}\``)
		}
	
		if (this.checkFilter(message)) {
			console.log(`${message.member.displayName}: ${message.cleanContent}`);
			message.delete();
		}
	}
}