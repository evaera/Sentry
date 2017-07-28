const {time} = require('./Util');

module.exports =
class Person {
	constructor(id) {
		this.id = id;
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

	async getDocument() {
		let document = await Sentry.db.findOne({ id: this.id });

		if (!document) {
			document = { id: this.id };
		}

		if (typeof document.mutes === 'undefined') document.mutes = [];

		return document;
	}

	async setDocument(document) {
		return await Sentry.db.update({ id: this.id }, document, { upsert: true });
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
		document.mutes.push({
			date: time(),
			who, reason,
			len: muteLengthMs
		});

		this.setDocument(document);
		
		this.member.addRole(process.env.MUTED_ROLE);

		this.user.send({embed:{
			title: "You've been muted in the Roblox Discord server",
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
		}});

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
	}

	async unmute(byWho, early) {
		let document = await this.getDocument();
		delete document.muted;
		this.setDocument(document);

		this.member.removeRole(process.env.MUTED_ROLE);

		if (early) {
			this.user.send({embed:{
				title: "You've been unmuted early by a moderator.",
				color: 0x2ecc71,
				description: "Welcome back.",
			}});
		} else {
			this.user.send({embed:{
				title: "Your mute period has ended.",
				color: 0x2ecc71,
				description: "Welcome back to the community. Please try to follow the rules in the future.",
			}});
		}
	}
}