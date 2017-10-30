'use strict';

require('dotenv').config();

const flow = require('../conversationflow');
const Intercom = require('../intercom');
const Queue = require('../queue');

const self = module.exports = {
    queue: new Queue(),

    getName: message => message.user.name ?
        message.user.name.split(" ", 1)[0] :
        'usuario'
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
        console.log(`1 ${flow.cache.keys()}`);
        console.log(`1.1 ${flow.cache.keys().map(k => JSON.stringify(flow.cache.get(k)))}`);
    },

    saveIncomingMessageIntoIntercom: (session, next) => {
        const channelId = session.message.address.channelId;
        const userId = session.message.user.id;

        if (channelId !== 'directline' || userId !== 'IntercomChannel') {
            if (!session.dialogData) {
                self.queue.add(() => Intercom.createConversationIntoIntercom({
                    user_id: userId,
                    name: self.getName(session.message),
                    conversationId: session.message.address.conversation.id
                }));
            }

            self.queue.add(() => Intercom.sendMessageToIntercom({
                conversation_user_id: userId,
                body: session.message.text,
                sender_id: userId
            }));
        }
    },

    saveOutgoingMessageIntoIntercom: (event, next) => {
        const channelId = event.address.channelId;
        const userId = event.address.user.id;

        if (channelId !== 'directline' || userId !== 'IntercomChannel') {
            self.queue.add(() => Intercom.sendMessageToIntercom({
                conversation_user_id: userId,
                body: event.text
            }));
        }
    }
};