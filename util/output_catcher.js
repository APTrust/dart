const { Constants } = require('../core/constants');
const { Context } = require('../core/context');

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
         * This maintains a reference to the original console.error function,
         * so when we're done capturing output, we can replace the Jest
         * mock function with console.log.
         *
         * @type {function}
         */
        this.consoleError = console.error;
        /**
         * An array of lines captured from STDOUT that match the filter
         * string/RegExp. This output is presumed to have come from the
         * subject of the test, not from Jest.
         *
         * @type {Array<string>}
         */
        this.subjectOutput = [];
        /**
         * An array of lines captured from STDERR that match the filter
         * string/RegExp. This output is presumed to have come from the
         * subject of the test, not from Jest.
         *
         * @type {Array<string>}
         */
        this.subjectError = [];
        /**
         * An array of lines captured from STDOUT that DO NOT match the filter
         * string/RegExp. This output is presumed to have come from Jest.
         *
         * @type {Array<string>}
         */
        this.jestOutput = [];
        /**
         * An array of lines captured from STDERR that DO NOT match the filter
         * string/RegExp. This output is presumed to have come from Jest.
         *
         * @type {Array<string>}
         */
        this.jestError = [];
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
            this._capture(data, 'stdout');
        });
        console.error = jest.fn(data => {
            this._capture(data, 'stderr');
        });
    }

    /**
     * Captures output and assigns it to the right collection.
     * Ignores output that matches {@link Constants.END_OF_ERROR_OUTPUT}.
     *
     * @private
     */
    _capture(data, stream) {
        var str = data.toString()
        if (str.match(Context.y18n.__(Constants.END_OF_ERROR_OUTPUT))) {
            return;
        }
        if (str.match(this.filter)) {
            stream == 'error' ? this.subjectError.push(str) : this.subjectOutput.push(str);
        } else {
            stream == 'error' ? this.jestError.push(str) : this.jestOutput.push(str);
        }
    }

    /**
     * Call this to stop capturing STDOUT and to relay all captured Jest
     * messages to the console.
     */
    relayJestOutput() {
        console.log = this.consoleLog;
        console.error = this.consoleError;
        if (this.jestOutput.length > 0) {
            console.log(this.jestOutput.join("\n"));
        }
        if (this.jestError.length > 0) {
            console.error(this.jestError.join("\n"));
        }
    }

}

module.exports.OutputCatcher = OutputCatcher;
