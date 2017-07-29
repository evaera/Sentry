require('dotenv').config();

const Sentry = require('./Sentry');
global.Sentry = new Sentry(process.env.TOKEN);