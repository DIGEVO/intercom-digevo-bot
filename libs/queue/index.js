'use strict';

class Queue {
    constructor() {
        this.jobs = [];
        setInterval(() => (this.jobs.shift() || (()=>{}))(), 500);
    }

    add(task) {
        this.jobs.push(task);
    }
}

module.exports = Queue;
