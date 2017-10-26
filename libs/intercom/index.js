'use strict';

const Intercom = require('intercom-client');
const NodeCache = require('node-cache');
const Q = require('q');
require('dotenv').config();

const convCache = require('../cache');

const self = module.exports = {
    client: new Intercom.Client({ token: process.env.TOKEN }),

    cache: [],

    sendMessageToIntecom({ user_id = 0, name = '', conversationId = 0, body = '', firstMsg = false }) {
        if (firstMsg) {
            return self.replyMessageToIntercom({ user_id: user_id, body: body, sender_id: user_id });
        } else {
            return self
                .countConversations(self.client.conversations.list({ type: 'user', user_id: user_id, }), 0)
                .then(c => { self.cache[user_id] = c; return undefined; })
                .then(() => self.createUser(user_id, name, conversationId))
                .then(r => self.createMessage(r.body.id, 'Iniciando conversación'))

                .then(o => {
                    const operation = () =>
                        self.countConversations(self.client.conversations.list({ type: 'user', user_id: user_id, }), 0);

                    const test = c => c > self.cache[user_id];

                    return self.retry(operation, test)
                        .catch(e => console.error(e));
                })
                .then(() => self.client.conversations.list({ type: 'user', user_id: user_id, }))
                .then(res => {
                    console.log(`////////////////////////// ${res.body.conversations[0].id}`);
                    convCache.cache[user_id] = res.body.conversations[0].id;
                    return res.body.conversations[0].id;
                })
                .then(id => self.replyMessage(id, body, user_id))

                .catch(e => console.error(e));
        }
    },

    //TODO ver paginado...
    getConversationSize(user_id) {
        return self.client.conversations
            .list({
                type: 'user',
                user_id: user_id,
            })
            .then(r => self.client.conversations.find(r.body.conversations[0]))
            .then(c => c.body.conversation_parts.conversation_parts.length)
            .catch(e => console.error(e));
    },

    replyMessageToIntercom({ user_id = 0, body = '', sender_id = process.env.BOT }) {
        const operation = () =>
            self.countConversations(self.client.conversations.list({ type: 'user', user_id: user_id, }), 0);

        const test = c => c > (self.cache[user_id] || Number.MAX_SAFE_INTEGER);

        return self.retry(operation, test)
            .then(() => self.client.conversations.list({ type: 'user', user_id: user_id, }))
            .then(c => self.replyMessage(c.body.conversations[0].id, body, sender_id))
            .catch(e => console.error(e));
    },

    createUser: (user_id, name, conversationId) =>
        self.client.users.create({
            user_id: user_id,
            name: name,
            custom_attributes: { conversationId: conversationId }
        })
    ,

    createMessage: (id, body) =>
        self.client.messages.create({
            from: { type: "user", id: id },
            body: body
        })
    ,

    replyMessage: (id, body, user_id = process.env.BOT) =>
        self.client.conversations.reply({
            id: id,
            type: 'user',
            message_type: 'comment',
            body: body,
            user_id: user_id
        })
    ,

    retry: (operation, test, delay = 1000) => {
        return operation()
            .then(res => !test(res) ? Q.delay(delay).then(self.retry.bind(null, operation, test, delay)) : res)
            .catch(error => console.error(error));
    },

    /*TODO se podría retornar arrastrar el ID de la 1ra conversación en todas las llamadas
        y retornarlo junto a la cantidad.*/
    countConversations: (promise, accumulator) => {
        return promise.then(res => {
            if (!res.body.pages.next)
                return accumulator + res.body.conversations.length;
            else
                return self.countConversations(self.client.nextPage(res.body.pages), accumulator + res.body.conversations.length);
        });
    }
};



