const glob = require('glob');
const path = require('path');
const { Context } = require('../core/context');
const { InternalSetting } = require('../core/internal_setting');


/**
  * This runs all migrations in the migrations directory.
  *
  * Migrations allow us to add, remove, or change application settings,
  * move and transform data and data structures, etc.
  *
  * Each migration must export a function called 'run', and it will be
  * run at startup.
  *
  * Migrations will be run in order (0001.js, 0002.js, etc.) and run()
  * will ALWAYS be called at startup. The run function should check an
  * internal var called 'Migration_0001' (or whatver its name is) and
  * should not re-run itself if it's been run before.
  */
function runAll() {
    let filePattern = path.join(__dirname, '*.js')
    glob.sync(filePattern).forEach( function( file ) {
        let basename = path.parse(file).name;
        console.log(basename)
        let name = `Migration_${basename}`
        if (basename.startsWith('20') && !hasAlreadyRun(name)) {
            var migration = require(path.resolve(file));
            Context.logger.info(`Starting migration ${name}`);
            let ok = migration.run(name)
            if (ok) {
                Context.logger.info(`Finished ${name}`);
                markAsRun(name)
            } else {
                Context.logger.info(`Failed: ${name}`);
            }
        }
    });
}

function hasAlreadyRun(name) {
    let record = InternalSetting.firstMatching('name', name);
    return (record && record.value)
}

function markAsRun(name) {
    let now = new Date().toISOString();
    let migrationRecord = new InternalSetting({
        name: name,
        value: now,
        userCanDelete: false
    });
    migrationRecord.save();
}

module.exports.runAll = runAll;
