const { Config } = require('../core/config');
const mkdirp = require('mkdirp');
const path = require('path');
const winston = require('winston');

const logFormat = winston.format.printf(function(info) {
    return `${new Date().toISOString()} - ${info.level}: ${info.message}`;
});

// NOTE: Set handleExceptions: false on all transports because these
// log exceptions without meaningful context.

// Define the custom settings for each transport.
// TODO: Make some of these into AppSettings or internal settings
// that can change at runtime.
var options = {
    // The log file for unit testing. Level debug will record a lot of detail.
    testLogFile: {
        level: 'debug',
        filename: path.join(Config.test.logDir, "dart.log"),
        format: logFormat,
        handleExceptions: false,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    // The log file for Travis
    travisLogFile: {
        level: 'debug',
        filename: path.join(__dirname, "logs", "dart.log"),
        format: logFormat,
        handleExceptions: false,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    // The log file for general users. Level info should record enough data
    // without being too verbose.
    userLogFile: {
        level: 'info',
        filename: path.join(Config.user.logDir, "dart.log"),
        format: logFormat,
        handleExceptions: false,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    // Log straight to console, with pretty colors.
    // This is the system console, not the electron console.
    console: {
        level: 'error',
        handleExceptions: false,
        format: winston.format.combine(
            winston.format.printf(({ level, message, timestamp, stack }) => {
                if (stack) {
                    // print log trace
                    return `${level}: ${message} - ${stack}`;
                }
                if (typeof message == 'object') {
                    message = JSON.stringify(message);
                }
                return `${level}: ${message}`;
            }),
        ),
    },
};

// The transports array tells us where to write our logs.
// For the user environment, we log to the user log file.
var transports;
var logFile = '';
// For Jest tests, use the test log
if (process.env.TRAVIS_OS_NAME) {
    mkdirp(path.dirname(options.travisLogFile.filename));
    logFile = options.travisLogFile.filename;
    transports = [ new winston.transports.File(options.travisLogFile) ];
} else if (process.env.NODE_ENV=='test') {
    mkdirp(path.dirname(options.testLogFile.filename));
    logFile = options.testLogFile.filename;
    transports = [ new winston.transports.File(options.testLogFile) ];
} else {
    mkdirp(path.dirname(options.userLogFile.filename));
    logFile = options.userLogFile.filename;
    transports = [ new winston.transports.File(options.userLogFile) ];
}

if (typeof window != undefined && process.env.NODE_ENV != 'test') {
    try {
        transports.push(new winston.transports.Console(options.console));
    } catch (ex) {
        // Shh!
    }
}


// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
    transports: transports,
    exitOnError: false
});

logger.pathToLogFile = function() {
    return logFile;
}

module.exports = logger;
