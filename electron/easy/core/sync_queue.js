// Sync Queue
// Synchronized queue for operations that must be performed
// one at a time in order. For example, writing files into
// a tar archive.

module.exports = class SyncQueue {
    constructor() {
        this.queue = [];
        this.active = false;
        this.count = 0;
    }

    push(fn) {
        this.queue.push(fn);
        if (!this.active) {
            this.next();
        }
    }

    next() {
        if (this.queue.length == 0) {
            this.active = false;
            return;
        }
        var fn = this.queue.shift();
        this.active = true;
        this.count += 1;
        console.log("Calling " + this.count);
        //console.log(fn);
        var q = this;
        fn().then(q.next());
    }

    clear() {
        this.queue = [];
        this.active = false;
    }
}
