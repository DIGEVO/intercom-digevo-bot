'use strict';

const Q = require('q');

const Intercom = require('../intercom');
const convCache = require('../cache');


class Queue {
    constructor() {
        this.jobs = [];

        setInterval(async () => {
            //(this.jobs.shift() || (()=>{}))()

            const task = this.jobs.shift();

            if (task){
               // console.log(`*****************************************> ${task.i}`);
                const id = await task.fn();
            }

            // const size = await Intercom.getConversationSize(task.userId);
            // console.log(`+++++++++++++++++++++++++++++++++++++++++> ${size} ${convCache.cache[task.userId]}`);

        }, 500);
    }

    add(task) {
        this.jobs.push(task);
    }
}

module.exports = Queue;

function retry(operation, test, delay = 1000) {
    return operation()
        .then(res => !test(res) ? Q.delay(delay).then(retry.bind(null, operation, test, delay)) : res)
        .catch(error => console.error(error));
}