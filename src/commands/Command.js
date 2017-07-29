const Commando = require('discord.js-commando')

module.exports =
class Command extends Commando.Command {
	constructor(client, info) {
		info.group = 'sentry';
		info.guildOnly = true;
		info.memberName = info.name;
		
		super(client, info);
	}

	hasPermission(msg) {
		for (let roleId of process.env.ADMIN_ROLES.split(',')) {
			if (msg.member.roles.has(roleId)) {
				return true;
			}
		}
		return false;
	}
}