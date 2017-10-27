'use strict';

require('dotenv').config();

class Queue {
    constructor() {
        this.jobs = [];

        setInterval(async function(jobs) {
            const task = jobs.shift();
            if (task) await task();
        }, process.env.TIMEOUT, this.jobs);
    }

    add(task) {
        this.jobs.push(task);
    }
}

module.exports = Queue;
