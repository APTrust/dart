/**
 * OpSummary contains summary information about an operation. This
 * class is used for logging and for passing info from child processes
 * back to the parent via stdout and stderr.
 */
class OpSummary {
    constructor(opts = {}) {
        /**
         * The name of the operation being performed. For example,
         * packaging, upload, etc.
         *
         * @type {string}
         */
        this.op = opts.op || null;
        /**
         * The name of the action being performed. An operation can
         * have a number of actions.
         *
         * @type {string}
         */
        this.action = opts.action || null;
        /**
         * An automatically-assigned ISO timestamp.
         *
         */
        this.ts = new Date().toISOString();
        /**
         * The message to log or to relay to the user.
         *
         * @type {string}
         */
        this.msg = opts.msg || null;
        /**
         * The status of the operation. See {@link Constants.OP_STATUSES}.
         *
         * @type {string}
         */
        this.status = opts.status || null;
        /**
         * This is a list of user-friendly error messages, each in
         * string format.
         *
         * @type {Array<string>}
         */
        this.errors = opts.errors || [];
        /**
         * The stack trace from an error object.
         * This is mainly for debugging.
         *
         * @type {string}
         */
        this.stack = opts.stack || null;
    }

    /**
     * Convert the object to JSON, omitting empty fields to save
     * space in the logs and overhead in IPC.
     *
     */
    toJSON() {
        var result = {};
        for (var x in this) {
            if (this[x] != null && this[x] != []) {
                result[x] = this[x];
            }
        }
        return result;
    }

    /**
     * Converts JSON representation of OpSummary back to object.
     */
    static inflateFrom(data) {
        let summary = new OpSummary();
        Object.assign(summary, data);
        return summary;
    }

}

module.exports.OpSummary = OpSummary;
