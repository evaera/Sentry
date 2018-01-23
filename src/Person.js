const {time} = require('./Util');

module.exports =
class Person {
	constructor(id) {
		this.id = id; // shayne was here
	}
	
	static async new(id) {
		let person = new Person(id);
		if (await person.prepare()) {
			return person;
		} else {
			return false;
		}
	}
	
	async prepare() {
		if (this.id === Sentry.bot.user.id) {
			return false;
		}

		try {
			this.user = await Sentry.bot.fetchUser(this.id);
			this.member = await Sentry.guild.fetchMember(this.user);
			if (this.user.bot) return false;
			return true;
		} catch (e) {
			return false;
		}
	}

	isModerator() {
		for (let roleId of process.env.ADMIN_ROLES.split(',')) {
			if (this.member.roles.has(roleId)) {
				return true;
			}
		}
		return false;
	}

	async isMuted() {
		let document = await this.getDocument();
		if (document.muted > 0) {
			return true;
		}
		return false;
	}
	
	async isVoiceMuted() {
		let document = await this.getDocument();
		if (document.voice_muted > 0) {
			return true;
		}
		return false;
	}

	async getVoiceMuteReason() {
		let document = await this.getDocument();
		if (document.voice_mute_reason) {
			return document.voice_mute_reason;
		}
		return '';
	}
	
	async numVoiceMutes() {
		let document = await this.getDocument();
		return document.num_voice_mutes;
	}
	
	async getMuteHistory() {
		let document = await this.getDocument();
		return document.mutes;
	}

	async getDocument() {
		let document = await Sentry.db.findOne({ id: this.id });

		if (!document) {
			document = { id: this.id };
		}

		if (typeof document.mutes === 'undefined') document.mutes = [];
		if (typeof document.num_voice_mutes === 'undefined') document.num_voice_mutes = 0;

		return document;
	}

	async setDocument(document) {
		return await Sentry.db.update({ id: this.id }, document, { upsert: true });
	}
	
	async unVoiceMute(who, skipMessage) {
		let document = await this.getDocument();
		delete document.voice_muted;
		this.setDocument(document);
		
		this.member.setMute(false);
		
		if (true) {
			return;
		}

		this.user.send({embed:{
			title: "Your voice-mute session is over.",
			color: 0x2ecc71,
			description: "You may now use your microphone.",
		}}).catch(()=>{});
	}
	
	async voiceMute(reason, who, channel) {
		let document = await this.getDocument();
		
		document.voice_muted = time() + 600000; // 10 minutes
		document.num_voice_mutes++;
		document.voice_mute_reason = `<@${who}>: ${reason}`;
		
		this.setDocument(document);
		
		this.member.setMute(true);
		
		this.user.send({embed:{
			title: "You've been voice-muted in " + Sentry.guild.name,
			color: 0xF1C40F,
			thumbnail: {
				url: "http://i.imgur.com/7B2vj52.png"
			},
			footer: { text: "Take this time to think about what you did. You only get so many chances..." },
			description: reason,
			fields: [
				{ name: "Length", value: "10 minutes", inline: true },
			]
		}}).catch(()=>{});
		
		Sentry.log({
			type: "muteVoice",
			id: this.id,
			modId: who,
			reason,
			fields: [
				{ name: "Length", value: "10 minutes", inline: true },
			]
		}, channel);
		
		let checks = 0;
		while (checks <= 4) {
			if (this.member.serverMute) break;
			await this.member.setMute(true);
			checks ++;
		}
	}
	
	async mute(reason, who, channelToClear) {
		if (await this.isMuted()) {
			return;			
		}

		if (typeof reason === 'object') {
			reason.evidence = reason.evidence.replace(/`/g, '');
			reason = `${reason.text}\n\`\`\`\n${reason.evidence}\`\`\``;
		}

		let document = await this.getDocument();

		let allMutes = document.mutes;
		let recentMutes = allMutes.filter(mute => {
			if (mute.kick === 1 || mute.warn === 1) return false;
			
			return time() - mute.date < 1000 * 60 * 60 * 24 * 30;
		});

		let muteLengthHours = recentMutes.length === 0 ? 0.5 : 2 ** (recentMutes.length -1);
		let muteLengthMs = muteLengthHours * 60 * 60 * 1000;
		let muteLengthText = `${muteLengthHours} hours`;

		if (muteLengthHours === 0.5) {
			muteLengthText = "30 minutes";
		} else if (muteLengthHours === 1) {
			muteLengthText = "1 hour";
		}

		document.muted = time() + muteLengthMs;
		document.voice_muted = document.muted;
		document.mutes.push({
			date: time(),
			who, reason,
			len: muteLengthMs
		});

		this.setDocument(document);
		
		this.member.addRole(process.env.MUTED_ROLE);
		this.member.setMute(true);

		this.user.send({embed:{
			title: "You've been muted in " + Sentry.guild.name,
			color: 0xe74c3c,
			thumbnail: {
				url: "http://i.imgur.com/6c8nq8C.png"
			},
			footer: { text: who === Sentry.bot.user.id ? "Automated mutes may be appealed. If you feel this mute was unfair, please DM a server moderator." : "Take this time to think about what you did. You only get so many chances..." },
			description: reason,
			fields: [
				{ name: "Length", value: muteLengthText, inline: true },
				{ name: "Times muted", value: allMutes.length, inline: true },
			]
		}}).catch(()=>{});

		if (channelToClear) {
			try {
				let messages = await channelToClear.fetchMessages({limit: 100});
				await channelToClear.bulkDelete(messages.filter(message => {
					return message.author.id === this.id;
				}));
			} catch (e) {
				// do nothing
			}
		}
		
		Sentry.log({
			type: "mute",
			id: this.id,
			modId: who,
			reason,
			fields: [
				{ name: "Length", value: muteLengthText, inline: true },
				{ name: "Times muted", value: allMutes.length, inline: true },
			]
		}, channelToClear);
	}
	
	async removeMute(index, who, channel) {
		let document = await this.getDocument();
		let mute = document.mutes[index];
		if (typeof mute === 'undefined') {
			return false;
		}
		document.mutes.splice(index, 1);
		this.setDocument(document);
		
		Sentry.log({
			type: "muteRemove",
			id: this.id,
			modId: who,
			fields: [
				{ name: "Length", value: `${(mute.len / 60 / 60 / 1000).toFixed(2)} hours`, inline: true },
				{ name: "Muted by", value: mute.who, inline: true },
				{ name: "Reason", value: mute.reason, inline: true }
			]
		}, channel);
	}
	
	async removeAllMutes(who, channel) {
		let document = await this.getDocument();
		document.mutes = [];
		this.setDocument(document);
		
		Sentry.log({
			type: "muteRemoveAll",
			id: this.id,
			modId: who
		}, channel);
	}

	async unmute(who, early, channel, reason) {
		let document = await this.getDocument();
		delete document.muted;
		
		if (early && reason) {
			document.mutes[ document.mutes.length - 1].reason += "\n\n" + reason;
		}
		
		this.setDocument(document);

		await this.member.removeRole(process.env.MUTED_ROLE);

		if (early) {
			this.user.send({embed:{
				title: "You've been unmuted early by a moderator.",
				color: 0x2ecc71,
				description: "Welcome back.",
			}}).catch(()=>{});
			
			Sentry.log({
				type: "unmuteManual",
				id: this.id,
				modId: who
			}, channel);
		} else {
			this.user.send({embed:{
				title: "Your mute period has ended.",
				color: 0x2ecc71,
				description: "Welcome back to the community. Please try to follow the rules in the future.",
			}}).catch(()=>{});
		}
	}
	
	async kick(reason, who, ban, channel) {
		let document = await this.getDocument();
		
		document.mutes.push({
			date: time(),
			who, reason,
			len: 0,
			kick: ban ? 2 : 1
		});
		
		this.setDocument(document);
		
		if (ban) {
			try {
				await this.user.send({embed:{
					title: "You have been banned from " + Sentry.guild.name,
					color: 0xc0392b,
					thumbnail: {
						url: "http://i.imgur.com/YtSakNq.png"
					},
					footer: { text: "You are no longer welcome in the server." },
					description: reason
				}});
			} catch (e) {
				// do nothing
			}
			
			Sentry.log({
				type: "ban",
				id: this.id,
				modId: who,
				reason
			}, channel);
			
			await this.member.ban({ days: 1 });
		} else {
			try {
				await this.user.send({embed:{
					title: "You have been kicked from " + Sentry.guild.name,
					color: 0xc0392b,
					thumbnail: {
						url: "http://i.imgur.com/YtSakNq.png"
					},
					footer: { text: "You may rejoin the server, but think about why you were kicked first." },
					description: reason
				}});
			} catch (e) {
				// do nothing
			}
			
			Sentry.log({
				type: "kick",
				id: this.id,
				modId: who,
				reason
			}, channel);
			
			await this.member.kick();
		}
	}
	
	async warn(reason, who, channel) {
		if (typeof reason === 'object') {
			reason.evidence = reason.evidence.replace(/`/g, '');
			reason = `${reason.text}\n\`\`\`\n${reason.evidence}\`\`\``;
		}
		
		let document = await this.getDocument();
		
		document.mutes.push({
			date: time(),
			who, reason,
			len: 0,
			warn: 1
		});
		
		this.setDocument(document);
		
		try {
			await this.user.send({embed:{
				title: "You have been warned in " + Sentry.guild.name,
				color: 0xFF9000,
				thumbnail: {
					url: "http://i.imgur.com/YtSakNq.png"
				},
				footer: { text: "This has been logged to your record." },
				description: reason
			}});
		} catch (e) {
			// do nothing
		}
			
		Sentry.log({
			type: "warn",
			id: this.id,
			modId: who,
			reason
		}, channel);
	
	}
}
