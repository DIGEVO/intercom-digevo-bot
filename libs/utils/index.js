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
        const cacheData = flow.cache[userId] || { paused: false };

        flow.cache[userId] = {
            paused: cacheData.paused,
            name: self.getName(session.message),
            address: session.message.address
        };
    },

    checkPauseState: (session, next) => {
        const userId = session.message.user.id;
        const cacheData = flow.cache[userId] || { paused: false };

        // console.log(`${JSON.stringify(cacheData)} - ${session.sessionState.callstack.map(d => JSON.stringify(d)).join('\n')}`);

        const businessOnStack = session.sessionState.callstack
            .map(d => d.id)
            .some(id => id.includes(process.env.BUSINESSDIALOG));

        if (cacheData.paused && businessOnStack) {
            console.log('--------------------> ok!');

            //session.endConversation();
            session.endDialog();
            //session.endConversation();
            // session.cancelDialog(process.env.BUSINESSDIALOG);
            // session.sessionState.callstack
            //     .map(d => d.id)
            //     .slice(1)
            //     .forEach(id => session.cancelDialog(id));
        }
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