/**
 * TaskDescription contains information describing a task performed by
 * the bag {@link Validator}. This object is emitted with the Validator's
 * 'task' event and may be useful for logging, debugging, and updating a
 * a GUI so the user knows the Validator is still working.
 *
 */
class TaskDescription {
    /**
     * Constructor returns a new TaskDescription.
     *
     * @param {string} path - Relative path to the file that the validator
     * is currently working on, or absolute path to the bag being validated
     * if we're describing a bag-level event.
     *
     * @param {string} op - The operation being performed on the file at
     * relPath.
     *
     * @param {string} message - A message suitable for logging or displaying
     * to the user.
     *
     */
    constructor(path, operation, message, percentComplete = -1) {
        /**
         * Relative path to the file that the validator
         * is currently working on, or absolute path to the bag being validated
         * if we're describing a bag-level event.
         *
         * @type {string}
         */
        this.path = path;
        /**
         * The operation being performed on the file at relPath.
         *
         * @type {string}
         */
        this.op = operation;
        /**
         * A message suitable for logging or displaying to the user.
         *
         * @type {string}
         */
        this.msg = message;
        /**
         * The percent complete of the entire operation, expressed as
         * a number between 0 and 100. This will be set only when the
         * operation is 'checksum'.
         *
         * @type {string}
         */
        this.percentComplete = percentComplete;
    }
}

module.exports.TaskDescription = TaskDescription;
