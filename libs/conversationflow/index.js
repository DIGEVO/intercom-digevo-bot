'use strict';

const builder = require('botbuilder');
const NodeCache = require('node-cache');
require('dotenv').config();

const self = module.exports = {
    cache: [],

    getWaterfall: () => [self.firstStep, self.finalStep]
    ,

    firstStep(session, args, next) {
        const channelId = session.message.address.channelId;
        const userId = session.message.user.id;

        if (channelId === 'directline' && userId === 'IntercomChannel') {
            self.sendMessage(session);
            next();
        } else {
            const cacheData = self.cache[userId] || { paused: false };
            if (!cacheData.paused)
                session.beginDialog(process.env.BUSINESSDIALOG);
            else
                next();
        }
    },

    finalStep(session, args, next) {
        session.endDialog();
    },

    sendMessage(session) {
        const msg = JSON.parse(session.message.text);
        const cacheData = self.cache[msg.userId] ||
            { paused: false, name: undefined, address: undefined };

        cacheData.paused = msg.paused;
        self.cache[msg.userId] = cacheData;

        let errorMsg = undefined;

        if (cacheData.address) {
            if (msg.text)
                session.library.send(new builder.Message().text(msg.text).address(cacheData.address));
        } else {
            const topic = msg.text ? `el mensaje ${msg.text}` : `la desactivación/activación del bot`;
            errorMsg = `Error: No se pudo enviar "${topic}" ` +
                `al cliente "${msg.userId}" porque la dirección del mismo no aparece en la cache.`;
            console.error(errorMsg);
        }

        session.send(errorMsg || (msg.text ? 'Mensaje enviado.' : 'Detención/Activación del bot.'));
    }
};