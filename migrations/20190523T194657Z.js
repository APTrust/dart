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
 */
function run() {
    let migration = path.parse(__filename).name;
    let migrationName = `Migration_${migration}`;
    let record = InternalSetting.firstMatching('name', migrationName);
    if (record && record.value) {
        //Context.logger.info(`Skipping migration ${migrationName}: was run on ${record.value}`);
        return;
    }
    Context.logger.info(`Starting migration ${migration}`);

    // This is the meat of the work...
    let appSetting = new AppSetting({
        name: 'Bagging Directory',
        value: path.join(os.homedir(), '.dart', 'bags')
    });
    appSetting.id = "5ad1da32-ae59-4868-be4a-99e9eaf5c985";
    appSetting.help = "Where should DART put the bags it builds?";
    appSetting.userCanDelete = false;
    appSetting.save();

    Context.logger.info(`Finished ${migration}`);
    let now = new Date().toISOString();
    let migrationRecord = new InternalSetting({
        name: migrationName,
        value: now,
        userCanDelete: false
    });
    migrationRecord.save();
}

module.exports.run = run;
