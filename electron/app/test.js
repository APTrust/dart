// To run:
// cd into the electron/app directory
// node test.js
//
var models = require('./models');
var test = require('tape');

test('BagItProfile constructor', function (t) {
    t.plan(2);
    var profile = new models.BagItProfile();
    t.ok(profile, "Profile should not be null");
    t.ok(profile.bagItProfileInfo, "Profile Info should not be null");
});

test('KeyValuePair constructor', function (t) {
    t.plan(3);
    var kvp = new models.KeyValuePair("key1", "value1");
    t.ok(kvp, "KeyValuePair should not be null");
    t.equal(kvp.key, "key1")
    t.equal(kvp.value, "value1")
});
