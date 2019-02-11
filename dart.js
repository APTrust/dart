// You can import all of DART except the UI components by
// requiring this file. If you want to add the UI components
// as well, simply add an import like this:
//
// DART.UI = require('../path/to/ui');

const BagIt = require('./bagit');
const Core = require('./core');
const Migrations = require('./migrations/migrations');
const { PluginManager } = require('./plugins/plugin_manager');

module.exports.BagIt = BagIt;
module.exports.Core = Core;
module.exports.Migrations = Migrations;
module.exports.PluginManager = PluginManager;
