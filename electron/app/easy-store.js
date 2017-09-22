var Datastore = require('nedb'),
    db = new Datastore({ filename: 'electron/easy-store-db.json', autoload: true }),
    dbProfiles = new Datastore({ filename: 'electron/profiles-db.json', autoload: true });

// init db - make sure aptrust and dpn profiles are loaded
// general page initialization
