const path = require('path');

const Discord = require('discord.js-commando');
const Datastore = require('nedb-promises');

const AutoModerator = require('./AutoModerator.js');
const Person = require('./Person.js');

module.exports = 
class Sentry {
	constructor() {
		this.bot = new Discord.Client({
			unknownCommandResponse: false,
			commandPrefix: ';'
		});
		
		this.autoModerator = new AutoModerator(this.bot);
		
		this.db = new Datastore('../data/data.db');
		
		// Events
		
		this.bot.on('message', message => this.autoModerator.processMessage(message));
		this.bot.on('messageUpdate', (oldMessage, newMessage) => this.autoModerator.processMessage(newMessage));
		this.bot.on('ready', () => this.onReady());
		
		// Register commands
		
		this.bot.registry
			.registerGroup('sentry', 'Sentry')
			.registerDefaultTypes()
			.registerCommandsIn(path.join(__dirname, 'commands'));
		
		// Login
		
		this.bot.login(process.env.TOKEN);
	}
	
	onReady() {
		this.guild = this.bot.guilds.get(process.env.GUILD_ID);
		console.log("Sentry is ready.");
	}
}