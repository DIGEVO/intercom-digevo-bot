'use strict';

const Intercom = require('intercom-client');
const NodeCache = require('node-cache');
const Q = require('q');
require('dotenv').config();

const Queue = require('../queue');

const self = module.exports = {
    client: new Intercom.Client({ token: process.env.TOKEN }),

    cache: [],//[new NodeCache({ stdTTL: process.env.TTL })],

    q: new Queue(),

    sendMessageToIntecom({ user_id = 0, name = '', conversationId = 0, body = '', firstMsg = false }) {
        if (firstMsg) {
            self.client.conversations.list({ type: 'user', user_id: user_id, })
                .then(c => self.replyMessage(c.body.conversations[0].id, body, user_id))
                .catch(e => console.error(e));
        } else {
            self
                .countPages(self.client.conversations.list({ type: 'user', user_id: user_id, }), 0)
                .then(c => { self.cache[user_id] = c; return undefined; })
                .then(() => self.createUser(user_id, name, conversationId))
                .then(r => self.createMessage(r.body.id, body))
                .catch(e => console.error(e));
        }
    },

    replyMessageToIntercom({ user_id = 0, body = '' }) {
        const operation = () =>
            self.countPages(self.client.conversations.list({ type: 'user', user_id: user_id, }), 0);

        const test = c => c > (self.cache[user_id] || Number.MAX_SAFE_INTEGER);

        self.retry(operation, test)
            .then(() => self.client.conversations.list({ type: 'user', user_id: user_id, }))
            .then(c => self.replyMessage(c.body.conversations[0].id, body))
            .catch(e => console.error(e));
    },

    createUser: (user_id, name, conversationId) =>
        self.client.users.create({
            user_id: user_id,
            name: name,
            custom_attributes: { conversationId: conversationId }
        })
    ,

    createMessage: (id, body) => {
        self.q.add(() => {
            console.log('----------------------> createMessage');
            self.client.messages.create({
                from: { type: "user", id: id },
                body: body
            });
        }
        );
    },

    replyMessage: (id, body, user_id = process.env.BOT) => {
        self.q.add(() =>{
            console.log('----------------------> replyMessage '+ `${body}`);
            self.client.conversations
                .reply({
                    id: id,
                    type: 'user',
                    message_type: 'comment',
                    body: body,
                    user_id: user_id
                });
            }
            );
    },

    retry: (operation, test, delay = 1000) => {
        return operation()
            .then(res => !test(res) ? Q.delay(delay).then(self.retry.bind(null, operation, test, delay)) : res)
            .catch(error => console.error(error));
    },

    /*TODO se podría retornar arrastrar el ID de la 1ra conversación en todas las llamadas
        y retornarlo junto a la cantidad.*/
    countPages: (promise, accumulator) => {
        return promise.then(res => {
            if (!res.body.pages.next)
                return accumulator + res.body.conversations.length;
            else
                return self.countPages(self.client.nextPage(res.body.pages), accumulator + res.body.conversations.length);
        });
    }
};



