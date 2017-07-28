require('dotenv').config();
const Discord = require('discord.js');

const {processMessage} = require('./AutoModeration.js');

const bot = new Discord.Client();

bot.on('message', processMessage);
bot.on('messageUpdate', (oldMessage, newMessage) => processMessage(newMessage));

bot.login(process.env.TOKEN);