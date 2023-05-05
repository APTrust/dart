const { AppSetting } = require('../core/app_setting');
const os = require('os');
const path = require('path');

/**
 * Migration 20220607T12003744Z updates the AppSetting "Bagging Directory"
 * so it's no longer hidden. This is per request in
 * https://github.com/APTrust/dart/issues/520
 *
 */
function run() {
    let oldDefaultValue = path.join(os.homedir(), '.dart', 'bags')
    let appSetting = AppSetting.inflateFrom(AppSetting.firstMatching('name', 'Bagging Directory'))
    if (appSetting.value != oldDefaultValue) {
        // User already customized this. Don't overwrite it.
        return true
    }
    appSetting.value = path.join(os.homedir(), 'Documents', 'DART')
    appSetting.save();
    return true
}

module.exports.run = run;
