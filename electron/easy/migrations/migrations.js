const glob = require('glob');
const path = require('path');

// Migrations allow us to add, remove, or change application settings,
// move and transform data and data structures, etc.
//
// Each migration must export a function called 'run', and it will be
// run at startup.
//
// Migrations will be run in order (0001.js, 0002.js, etc.) and run()
// will ALWAYS be called at startup. The run function should check an
// internal var called 'Migration_0001' (or whatver its name is) and
// should not re-run itself if it's been run before.

function runAll() {
    glob.sync( './easy/migrations/*.js' ).forEach( function( file ) {
        if (!file.endsWith('migrations.js')) {
            var migration = require(path.resolve(file));
            migration.run()
        }
    });
}

module.exports.runAll = runAll;
