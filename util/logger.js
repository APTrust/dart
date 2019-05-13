const { Config } = require('../core/config');
const mkdirp = require('mkdirp');
const path = require('path');
const winston = require('winston');

const logFormat = winston.format.printf(function(info) {
    return `${new Date().toISOString()} - ${info.level}: ${JSON.stringify(info.message)}`;
});


// Define the custom settings for each transport.
// TODO: Make some of these into AppSettings or internal settings
// that can change at runtime.
var options = {
    // The log file for unit testing. Level debug will record a lot of detail.
    testLogFile: {
        level: 'debug',
        filename: path.join(Config.test.logDir, "dart.log"),
        format: logFormat,
        handleExceptions: true,
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
        handleExceptions: true,
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
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    // Log straight to console, with pretty colors.
    // This is the system console, not the electron console.
    console: {
        level: 'debug',
        handleExceptions: true,
        format: winston.format.combine(winston.format.colorize(), logFormat),
        json: false,
        colorize: true,
    },
};

// The transports array tells us where to write our logs.
// For the user environment, we log to the user log file.
var transports;
// For Jest tests, use the test log
if (process.env.TRAVIS_OS_NAME) {
    mkdirp(path.dirname(options.travisLogFile.filename));
    transports = [ new winston.transports.File(options.travisLogFile) ];
} else if (process.env.NODE_ENV=='test') {
    mkdirp(path.dirname(options.testLogFile.filename));
    transports = [ new winston.transports.File(options.testLogFile) ];
} else {
    mkdirp(path.dirname(options.userLogFile.filename));
    transports = [ new winston.transports.File(options.userLogFile) ];
}

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
    transports: transports,
    exitOnError: false
});

logger.pathToLogFile = function() {
    for (let transport of logger.transports) {
        if (transport.constructor.name === 'File') {
            return path.join(transport.dirname, transport.filename);
        }
    }
}

module.exports = logger;
