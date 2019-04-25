/**
 * This class captures data written to STDOUT during tests
 * and divides it into jestOutput and subjectOutput. The jestOutput,
 * including messages about failed tests, can then be flushed to the user
 * while the subject output can be suppressed or examined.
 *
 * This class is primarily useful for running tests on subject methods
 * that produce a lot of STDOUT output that should not pollute Jest's
 * test output.
 *
 * @param {string|RegExp} filter - A string or regular expression to
 * identify output from the test subject. Any output matching this string
 * or regex will be considered subjectOutput. Any output not matching
 * will be considered to have come from Jest.
 */
class OutputCatcher {
    constructor(filter) {
        /**
         * A string or RegExp to match to identify output from the
         * test subject.
         *
         * @type {string|RegExp}
         */
        this.filter = filter;
        /**
         * This maintains a reference to the original console.log function,
         * so when we're done capturing output, we can replace the Jest
         * mock function with console.log.
         *
         * @type {function}
         */
        this.consoleLog = console.log;
        /**
         * An array of lines captured from STDOUT that match the filter
         * string/RegExp. This output is presumed to have come from the
         * subject of the test, not from Jest.
         *
         * @type {Array<string>}
         */
        this.subjectOutput = [];
        /**
         * An array of lines captured from STDOUT that DO NOT match the filter
         * string/RegExp. This output is presumed to have come from Jest.
         *
         * @type {Array<string>}
         */
        this.jestOutput = [];
    }

    /**
     * Call this to begin capturing output from STDOUT. All output matching
     * the filter will be captured in the subjectOutput array. All other
     * output will go into the jestOutput array.
     *
     */
    captureOutput() {
        this.subjectOutput = [];
        this.jestOutput = [];
        console.log = jest.fn(data => {
            var str = data.toString()
            if (str.match(this.filter)) {
                this.subjectOutput.push(str);
            } else {
                this.jestOutput.push(str);
            }
        });
    }

    /**
     * Call this to stop capturing STDOUT and to relay all captured Jest
     * messages to the console.
     */
    relayJestOutput() {
        console.log = this.consoleLog;
        if (this.jestOutput.length > 0) {
            console.log(this.jestOutput.join("\n"));
        }
    }

}

module.exports.OutputCatcher = OutputCatcher;
