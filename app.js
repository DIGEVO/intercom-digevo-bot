'use strict';

const builder = require('botbuilder');

const botutils = require('./libs/botutils');
const flow = require('./libs/conversationflow');
const middleware = require('./libs/middleware');
const utils = require('./libs/utils');

require('dotenv').config();

const bot = botutils.initBot();

middleware.initMiddleware(bot);
middleware.addIncomingMessageHandler(utils.saveIncomingMessageIntoCache);
middleware.addIncomingMessageHandler(utils.saveMessageIntoIntercom);
middleware.addOutgoingMessageHandler(utils.saveMessageIntoIntercom);

bot.dialog('/', flow.getWaterfall());

bot.dialog('BusinessDialog', [
    session => {
        session.endDialog(`Hola ${utils.getName(session.message)}, ` +
            `me dijiste: ${session.message.text}`);
    }
]);
