const { BagItUtil } = require('./bagit_util');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const path = require('path');
//const { TestUtil } = require('../core/test_util');

const BASE_PATH = path.join(__dirname, '..', 'test', 'profiles', 'bagit_profiles_github');
const FOO_PATH = path.join(BASE_PATH, 'bagProfileFoo.json');
const BAR_PATH = path.join(BASE_PATH, 'bagProfileBar.json');

// This implicitly tests profileFromStandardObject as well.
test('profileFromStandardJson', () => {
    let fooProfileJson = fs.readFileSync(FOO_PATH).toString();
    let origProfile = JSON.parse(fooProfileJson);
    let convertedProfile = BagItUtil.profileFromStandardJson(fooProfileJson);

    console.log(JSON.stringify(convertedProfile, null, 2));

    expect(convertedProfile.name).toEqual("BagIt profile for packaging disk images");
    expect(convertedProfile.description).toEqual(Context.y18n.__("Imported from %s", "http://www.library.yale.edu/mssa/bagitprofiles/disk_images.json"));
    expect(convertedProfile.acceptSerialization).toEqual(["application/zip", "application/tar"]);
    expect(convertedProfile.allowFetchTxt).toBe(false);
    expect(convertedProfile.manifestsRequired).toEqual(["md5"]);
    expect(convertedProfile.manifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(convertedProfile.tagManifestsRequired).toEqual([]);
    expect(convertedProfile.tagManifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(convertedProfile.tagFilesAllowed).toEqual(["*"]);
    // expect(convertedProfile.name).toEqual("");
    // expect(convertedProfile.name).toEqual("");
    // expect(convertedProfile.name).toEqual("");
});
