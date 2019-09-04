const { BagItUtil } = require('./bagit_util');
const { Constants } = require('../core/constants');
var fs = require('fs');
const path = require('path');
//const { TestUtil } = require('../core/test_util');

const BASE_PATH = path.join(__dirname, '..', 'test', 'profiles', 'bagit_profiles_github');
const FOO_PATH = path.join(BASE_PATH, 'bagProfileFoo.json');
const BAR_PATH = path.join(BASE_PATH, 'bagProfileBar.json');

test('profileFromStandardJson', () => {
    let fooProfileJson = fs.readFileSync(FOO_PATH).toString();
    //console.log(fooProfileJson);
    let profile = BagItUtil.profileFromStandardJson(fooProfileJson);

    // Start Here
    // TODO: Actual tests!
});

// test('profileFromStandardObject', () => {

// });
