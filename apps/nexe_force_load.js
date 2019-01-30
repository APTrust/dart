// Force nexe to load some files that our node modules load dynamically.
// Nexe will only get these files into the CLI app bundle if we explicitly
// require them at build time.
//
// We don't have to export anything here, we just have to require.
//
// Note that files required for localization are loaded in the build-cli.sh
// script using the command-line flag:
//
//    -r locales/*.json
//
// That flag doesn't seem to work for files buried in the node_modules
// directory.
// -------------------------------------------------------------------------


// Files required for the winston logger user in util/logger.
// These are buried in the node_modules directory.
const { printf } = require('logform/printf');
const { combine } = require('logform/combine');
const { colorize } = require('logform/colorize');
