const Commando = require('discord.js-commando')

module.exports =
class Command extends Commando.Command {
	constructor(client, info) {
		info.group = 'sentry';
		info.guildOnly = true;
		info.memberName = info.name;
		
		super(client, info);
		
		this.name = info.name;
	}

	hasPermission(msg) {
		if (this.name === "request") return true;
		if (this.name === "join") return true;
		if (this.name === "leave") return true;
		if (this.name === "proverb") return true;
		for (let roleId of process.env.ADMIN_ROLES.split(',')) {
			if (msg.member.roles.has(roleId)) {
				return true;
			}
		}
		return false;
	}
}
