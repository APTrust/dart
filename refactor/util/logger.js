const { Config } = require('../core/config');
const path = require('path');
const winston = require('winston');

// Define the custom settings for each transport.
// TODO: Make some of these into AppSettings or internal settings
// that can change at runtime.
var options = {
    // The log file for unit testing. Level debug will record a lot of detail.
    testLogFile: {
        level: 'debug',
        filename: path.join(Config.test.logDir, "dart.log"),
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
        json: false,
        colorize: true,
    },
};

// The transports array tells us where to write our logs.
// For the user environment, we log to the user log file.
var transports = [ new winston.transports.File(options.userLogFile) ];
// For Jest tests, use the test log
if (process.env.NODE_ENV=='test') {
    transports = [ new winston.transports.File(options.testLogFile) ];
}
// If we're running with "npm start" using the local node Electron,
// we're in dev mode. Log to the console so we can see what's
// happening.
if (process.execPath.includes(path.join('node_modules', 'electron'))) {
    transports.push(new winston.transports.Console(options.console));
}

// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
    transports: transports,
    exitOnError: false
});

module.exports = logger;
