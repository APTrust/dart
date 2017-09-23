var basepath = __dirname;
const path = require('path');

// Hack. Replace later with user data path. But for now, WTF, electron??
basepath = basepath.replace('/static/js', '');

var Datastore = require('nedb'),
	db = new Datastore({ filename: path.join(basepath, 'easy-store-db.json'), autoload: true }),
	dbProfiles = new Datastore({ filename: path.join(basepath, 'profiles-db.json'), autoload: true });

console.log(path.join(basepath, 'easy-store-db.json'))
console.log(path.join(basepath, 'profiles-db.json'))

// Returns a list of all BagIt Profiles.
function profiles(callback) {
	dbProfiles.find({}, callback);
}


module.exports.profiles = profiles
