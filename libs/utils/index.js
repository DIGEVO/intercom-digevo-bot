'use strict';

require('dotenv').config();

const flow = require('../conversationflow');
const Intercom = require('../intercom');

const self = module.exports = {
    getName: message => message.user.name.split(" ", 1)[0]
    ,

    getGreetting: message => {
        const date = new Date(message.timestamp);
        const userLocalTime = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        const hour = userLocalTime.getHours();
        return hour < 12 ? 'buenos días' : hour >= 19 ? 'buenas noches' : 'buenas tardes';
    },

    saveIncomingMessageIntoCache: (session, next) => {
        const userId = session.message.user.id;
        const cacheData = flow.cache.get(userId) || { paused: false };

        flow.cache.set(userId, {
            paused: cacheData.paused,
            name: self.getName(session.message),
            address: session.message.address
        });
    },

    saveMessageIntoIntercom: (session, next) => {
        const channelId = session.message.address.channelId;
        const userId = session.message.user.id;

        if (channelId !== 'directline' || userId !== 'IntercomChannel') {
            logIntoIntecom({
                user_id: userId,
                name: self.getName(session.message),
                conversationId: event.address.conversation.id,
                body: session.message.text
            });
        }
    }
    //     ,

    //     saveOutgoingMessageIntoIntercom: (event, next) => { 

    //         /*
    // exports.LogOutgoingMessage = (event, next) => {
    //     try {
    //         event.bot_id = new ObjectID(process.env.BOT_ID);
    //         new OutMessageModel(event).save();
    //         next();
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }
    //         */
    //     }
};