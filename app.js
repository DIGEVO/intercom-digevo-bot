'use strict';

const builder = require('botbuilder');

const botutils = require('./libs/botutils');
const flow = require('./libs/conversationflow');
const middleware = require('./libs/middleware');
const utils = require('./libs/utils');

require('dotenv').config();

const bot = botutils.initBot();

// middleware.initMiddleware(bot);
// middleware.addIncomingMessageHandler(utils.saveIncomingMessageIntoCache);
// middleware.addIncomingMessageHandler(utils.checkPauseState);
// middleware.addIncomingMessageHandler(utils.saveIncomingMessageIntoIntercom);
// middleware.addOutgoingMessageHandler(utils.saveOutgoingMessageIntoIntercom);

bot.dialog('/', flow.getWaterfall());

bot.dialog('BusinessDialog', [

    (session, args, next) => {
        session.dialogData.firstContact = true;
        builder.Prompts.text(session, `Hola ${utils.getName(session.message)}, cuál es tu nombre?`);
    },

    (session, args, next) => {
        session.dialogData.name = args.response;
        builder.Prompts.text(session, `Dime cuál es tu edad "${session.dialogData.name}"`);
    },

    (session, args, next) => {
        session.dialogData.age = args.response;
        session.endDialog(`Muy bien "${session.dialogData.name}" de "${session.dialogData.age}" años`);
    }

]);
