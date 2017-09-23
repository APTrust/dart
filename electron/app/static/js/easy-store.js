//const {app, BrowserWindow} = require('electron')
//var basepath = app.getAppPath();
var basepath = __dirname;
const path = require('path');
var Datastore = require('nedb'),
	db = new Datastore({ filename: path.join(basepath, '/easy-store-db.json'), autoload: true }),
	dbProfiles = new Datastore({ filename: path.join(basepath, '/profiles-db.json'), autoload: true });

console.log(basepath)

// Returns a list of all BagIt Profiles.
function profiles() {
	db.find({ field: {$exists: 'BagIt-Profile-Info'}}, function (err, docs) {
		if (err) {
			console.log(err);
		}
		return docs
	});
}


module.exports.profiles = profiles
