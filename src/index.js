require('dotenv').config();

const Sentry = require('./Sentry');
global.Sentry = new Sentry(process.env.TOKEN);

setTimeout( () => {
  process.exit();
}, 25 * 60 * 1000);
