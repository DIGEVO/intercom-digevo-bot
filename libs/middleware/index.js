'use strict';

const self = module.exports = {
    inMsgFuns: [],

    outMsgFuns: [],

    initMiddleware: bot => bot.use({
        botbuilder: processIncomingMessage,
        send: processOutgoingMessage
    }),

    addIncomingMessageHandler: functionHandler =>
        self.inMsgFuns.push(functionHandler)
    ,

    addOutgoingMessageHandler: functionHandler =>
        self.outMsgFuns.push(functionHandler)
    ,

    processIncomingMessage(session, next) {
        processMessages(session, next, self.inMsgFuns, 'incoming');
    },

    processOutgoingMessage(event, next) {
        processMessages(event, next, self.outMsgFuns, 'outgoing');
    },

    processMessages(param1, param2, arrFuns, msg) {
        let errorMsg = '';

        arrFuns.forEach((fun, i) => {
            try {
                fun(param1, () => { });
            } catch (error) {
                errorMsg.concat(`Error on ${msg} message function ${i}: ${error}\n`);
            }
        });

        if (errorMsg !== '') console.error(errorMsg);

        param2();
    }
};
