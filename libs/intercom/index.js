'use strict';

const Intercom = require('intercom-client');

require('dotenv').config();

const self = module.exports = {
    client: new Intercom.Client({ token: process.env.TOKEN }),

    createConversationIntoIntercom({ user_id = 0, name = '', conversationId = '' }) {
        return self
            .createUser(user_id, name, conversationId)
            .then(r => self.createMessage(r.body.id, 'Iniciando conversación'))
            .catch(e => console.error(e));
    },

    sendMessageToIntercom({ conversation_user_id = 0, body = '', sender_id = process.env.BOT }) {
        return self.client.conversations
            .list({ type: 'user', user_id: conversation_user_id, })
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
};



