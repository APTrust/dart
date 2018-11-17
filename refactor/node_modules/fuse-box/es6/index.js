
        const path = require("path");
        process.env.FUSEBOX_DIST_ROOT = path.resolve(__dirname, "../");
        process.env.FUSEBOX_MODULES = path.resolve(__dirname, "../modules");
        process.env.FUSEBOX_VERSION = path.resolve(__dirname, "../package.json")
        module.exports = require('./es6.js');
    