'use strict';

require('dotenv').config();

const self = module.exports = {
    initBot() {
        const builder = require('botbuilder');
        const connector = self.getConnector(builder);
        self.startServer(connector);
        return self.getBot(builder, connector);
    },

    startServer(connector) {
        const restify = require('restify');
        const server = restify.createServer();
        server.listen(
            process.env.port || process.env.PORT || 3978,
            () => console.log('%s listening to %s', server.name, server.url));
        server.post('/api/messages', connector.listen());
    },

    getConnector: builder => new builder.ChatConnector({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword,
        stateEndpoint: process.env.BotStateEndpoint,
        openIdMetadata: process.env.BotOpenIdMetadata
    }),

    getBot: (builder, connector) =>
        new builder.UniversalBot(
            connector,
            { localizerSettings: { defaultLocale: process.env.DEFAULT_LOCALE } })
};
