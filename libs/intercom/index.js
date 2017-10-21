'use strict';

const Intercom = require('intercom-client');
require('dotenv').config();

const self = module.exports = {
    client: new Intercom.Client({ token: process.env.TOKEN }),

    logIntoIntecom({ user_id = 0, name = '', conversationId = 0, body = '' }) {
        self.client.users
            .create({
                user_id: user_id,
                name: name,
                custom_attributes: {
                    conversationId: conversationId
                }
            })
            .then(r => client.messages.create({
                from: {
                    type: "user",
                    id: r.body.id
                },
                body: body
            }))
            .catch(e => console.error(e));
    }
};

