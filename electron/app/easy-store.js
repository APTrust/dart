var Datastore = require('nedb'),
    db = new Datastore({ filename: 'electron/easy-store-db.json', autoload: true });

var sample = {
	name: 'Sample Record',
	number: 42,
	time: 'now'
}
db.insert(sample)
