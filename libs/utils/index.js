'use strict';

require('dotenv').config();

const flow =        require('../conversationflow');
const Intercom =    require('../intercom');

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

    saveIncomingMessageIntoIntercom: (session, next) => {
        const channelId = session.message.address.channelId;
        const userId = session.message.user.id;

        //console.log(JSON.stringify(session.dialogData));

        if (channelId !== 'directline' || userId !== 'IntercomChannel') {
            Intercom.sendMessageToIntecom({
                user_id: userId,
                name: self.getName(session.message),
                conversationId: session.message.address.conversation.id,
                body: session.message.text,
                firstMsg: session.dialogData
            });
        }
    },

    saveOutgoingMessageIntoIntercom: (event, next) => {
        const channelId = event.address.channelId;
        const userId = event.address.user.id;

        if (channelId !== 'directline' || userId !== 'IntercomChannel') {
            Intercom.replyMessageToIntercom({
                user_id: userId,
                body: event.text
            });
        }
    }
};