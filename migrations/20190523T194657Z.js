const { AppSetting } = require('../core/app_setting');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');
const os = require('os');
const path = require('path');

/**
 * Migration 20190523194657Z adds the AppSetting "Bagging Directory",
 * which is required for bagging. This tells DART where to put the
 * bags it creates.
 * 
 * Note: This changes in a the migration of 2022-06-07, per user request.
 * https://github.com/APTrust/dart/issues/520
 *
 */
function run() {
    let appSetting = new AppSetting({
        name: 'Bagging Directory',
        value: path.join(os.homedir(), '.dart', 'bags')
    });
    appSetting.id = "5ad1da32-ae59-4868-be4a-99e9eaf5c985";
    appSetting.help = "Where should DART put the bags it builds?";
    appSetting.userCanDelete = false;
    appSetting.save();
    return true
}

module.exports.run = run;
