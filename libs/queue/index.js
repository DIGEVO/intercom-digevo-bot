'use strict';

class Queue {
    constructor() {
        this.jobs = [];
        setInterval(() => {
            //(this.jobs.shift() || (()=>{}))()
            const j = this.jobs.shift();
            const t = j || (()=>{});
            t();
        }, 500);
    }

    add(task) {
        this.jobs.push(task);
    }
}

module.exports = Queue;
