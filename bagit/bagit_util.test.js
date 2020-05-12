const { BagItUtil } = require('./bagit_util');
const { Constants } = require('../core/constants');
const { Context } = require('../core/context');
const fs = require('fs');
const path = require('path');
const { TestUtil } = require('../core/test_util');

const BASE_PATH = path.join(__dirname, '..', 'test', 'profiles', 'bagit_profiles_github');
const FOO_PATH = path.join(BASE_PATH, 'bagProfileFoo.json');
const BAR_PATH = path.join(BASE_PATH, 'bagProfileBar.json');

const LOC_PATH = path.join(__dirname, '..', 'test', 'profiles', 'loc');
const LOC_ORDERED_PATH = path.join(LOC_PATH, 'SANC-state-profile.json');
const LOC_UNORDERED_PATH = path.join(LOC_PATH, 'other-project-profile.json');

// This implicitly tests profileFromStandardObject as well.
test('profileFromStandardJson', () => {
    let fooProfileJson = fs.readFileSync(FOO_PATH).toString();
    let origProfile = JSON.parse(fooProfileJson);
    let convertedProfile = BagItUtil.profileFromStandardJson(fooProfileJson);

    expect(convertedProfile.name).toEqual("BagIt profile for packaging disk images");
    expect(convertedProfile.description).toEqual(Context.y18n.__("Imported from %s", "http://www.library.yale.edu/mssa/bagitprofiles/disk_images.json"));
    expect(convertedProfile.acceptSerialization).toEqual(["application/zip", "application/tar"]);
    expect(convertedProfile.allowFetchTxt).toBe(false);
    expect(convertedProfile.manifestsRequired).toEqual(["md5"]);
    expect(convertedProfile.manifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(convertedProfile.tagManifestsRequired).toEqual([]);
    expect(convertedProfile.tagManifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(convertedProfile.tagFilesAllowed).toEqual(["*"]);
    expect(convertedProfile.serialization).toEqual("required");

    // BagItProfileInfo
    expect(convertedProfile.bagItProfileInfo.bagItProfileIdentifier).toEqual("http://www.library.yale.edu/mssa/bagitprofiles/disk_images.json");
    expect(convertedProfile.bagItProfileInfo.bagItProfileVersion).toEqual("1.1.0");
    expect(convertedProfile.bagItProfileInfo.contactName).toEqual("Mark Matienzo");
    expect(convertedProfile.bagItProfileInfo.externalDescription).toEqual("BagIt profile for packaging disk images");
    expect(convertedProfile.bagItProfileInfo.sourceOrganization).toEqual("Yale University");
    expect(convertedProfile.bagItProfileInfo.version).toEqual("0.3");

    // Tags
    expect(convertedProfile.tags.length).toEqual(17);

    let sourceOrg = convertedProfile.firstMatchingTag("tagName", "Source-Organization");
    expect(sourceOrg).toBeDefined();
    expect(sourceOrg.required).toBe(true);
    expect(sourceOrg.values).toEqual(["Simon Fraser University", "York University"]);
    expect(sourceOrg.defaultValue).toBeNull();

    let contactPhone = convertedProfile.firstMatchingTag("tagName", "Contact-Phone");
    expect(contactPhone).toBeDefined();
    expect(contactPhone.required).toBe(true);
    expect(contactPhone.isBuiltIn).toBe(false);
    expect(contactPhone.isUserAddedFile).toBe(false);
    expect(contactPhone.isUserAddedTag).toBe(false);
    expect(contactPhone.wasAddedForJob).toBe(false);
});


test('profileFromStandardJson with tag files', () => {
    let barProfileJson = fs.readFileSync(BAR_PATH).toString();
    let origProfile = JSON.parse(barProfileJson);
    let convertedProfile = BagItUtil.profileFromStandardJson(barProfileJson);

    expect(convertedProfile.tagFilesAllowed.length).toEqual(1);
    expect(convertedProfile.tagFilesAllowed).toEqual(origProfile["Tag-Files-Allowed"]);

    // A.D. - 2019-09-05
    //
    // We're not currently supporting tagFilesRequired because we want
    // a change to the spec. See https://trello.com/c/SBLvoiwK
    //
    // expect(convertedProfile.tagFilesRequired.length).toEqual(2);
    // expect(convertedProfile.tagFilesRequired).toEqual(origProfile["Tag-Files-Required"]);
})

test('profileToStandardObject', () => {
    let profile = TestUtil.loadProfile('multi_manifest.json');
    let obj = BagItUtil.profileToStandardObject(profile);
    let expected = expectedStandardObject();
    expect(obj).toBeDefined();
    expect(obj).toEqual(expected);
});

test('profileToStandardJson', () => {
    let profile = TestUtil.loadProfile('multi_manifest.json');
    let json = BagItUtil.profileToStandardJson(profile);
    let expected = JSON.stringify(expectedStandardObject(), null, 2);
    expect(json).toBeDefined();
    expect(json).toEqual(expected);
});

test('guessProfileType', () => {
    let dartProfile = TestUtil.loadProfile('multi_manifest.json');
    expect(BagItUtil.guessProfileType(dartProfile)).toEqual('dart');

    let locOrdered = JSON.parse(fs.readFileSync(LOC_ORDERED_PATH));
    expect(BagItUtil.guessProfileType(locOrdered)).toEqual('loc_ordered');

    let locUnordered = JSON.parse(fs.readFileSync(LOC_UNORDERED_PATH));
    expect(BagItUtil.guessProfileType(locUnordered)).toEqual('loc_unordered');

    let githubBagit = JSON.parse(fs.readFileSync(FOO_PATH));
    expect(BagItUtil.guessProfileType(githubBagit)).toEqual('bagit_profiles');

    // Path to StorageService object
    let ssPath = path.join(__dirname, '..', 'test', 'fixtures', 'StorageService_001.json');
    let notAProfile = JSON.parse(fs.readFileSync(ssPath));
    expect(BagItUtil.guessProfileType(notAProfile)).toEqual('unknown');
});

test('profileFromLOCOrdered', () => {
    let locOrdered = JSON.parse(fs.readFileSync(LOC_ORDERED_PATH));
    let p = BagItUtil.profileFromLOCOrdered(locOrdered);

    testBasicLOCProps(p);

    let importedTagNames = [
        "itemNumber",
        "rcNumber",
        "transferringAgencyName",
        "creatingAgencyName",
        "creatingAgencySubdivision",
        "transferringEmployee",
        "receivingInstitution",
        "receivingInstitutionAddress",
        "datesOfRecords (YYYY-MM-DD) - (YYYY-MM-DD)",
        "digitalOriginality",
        "Classification (for Access)",
        "digitalContentStructure",
        "Notes"
    ];

    for (let tagName of importedTagNames) {
        let tag = p.firstMatchingTag("tagName", tagName);
        expect(tag).toBeDefined();
    }

    let classTag = p.firstMatchingTag("tagName", "Classification (for Access)");
    expect(classTag.required).toBe(true);
    expect(classTag.values).toEqual([
        '???',
        'Open/Public',
        'Open/Redacted',
        'Contains Some Confidental Records',
        'Confidential/Sensitive',
        'Not-Yet-Known' ]);
    expect(classTag.defaultValue).toEqual('???');
});

test('profileFromLOCUnordered', () => {
    let locUnordered = JSON.parse(fs.readFileSync(LOC_UNORDERED_PATH));
    let p = BagItUtil.profileFromLOC(locUnordered);

    testBasicLOCProps(p);

    let importedTagNames = [
	    "Send-To-Name",
        "Send-To-Phone",
        "Send-To-Email",
        "External-Identifier",
        "Media-Identifiers",
        "Number-Of-Media-Shipped",
        "Additional-Equipment",
        "Ship-Date",
        "Ship-Method",
        "Ship-Tracking-Number",
        "Ship-Media",
        "Ship-To-Address"
    ];
    for (let tagName of importedTagNames) {
        let tag = p.firstMatchingTag("tagName", tagName);
        expect(tag).toBeDefined();
    }

    let sendToEmail = p.firstMatchingTag("tagName", "Send-To-Email");
    expect(sendToEmail.required).toBe(true);
    expect(sendToEmail.defaultValue).toEqual("sbos@loc.gov");
    expect(sendToEmail.values).toEqual(["sbos@loc.gov"]);

    let tracking = p.firstMatchingTag("tagName", "Ship-Tracking-Number");
    expect(tracking.required).toBe(false);
    expect(tracking.defaultValue).toBeNull();
    expect(tracking.values).toEqual([]);
});

test('_getProfileName', () => {
    let expectedStart = Context.y18n.__("Imported Profile");
    expect(BagItUtil._getProfileName().startsWith(expectedStart)).toBe(true);

    let sourceUrl = "https://example.com/profiles/profile.json"
    let expectedWithURL = Context.y18n.__("Profile imported from %s", sourceUrl);
    expect(BagItUtil._getProfileName(sourceUrl)).toEqual(expectedWithURL);
});

function testBasicLOCProps(p) {
    expect(p.name.startsWith(Context.y18n.__("Imported Profile"))).toBe(true);
    expect(p.description.startsWith(Context.y18n.__("Imported Profile"))).toBe(true);
    expect(p.manifestsRequired).toEqual(['sha256']);
    expect(p.manifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(p.tagManifestsRequired).toEqual([]);
    expect(p.tagManifestsAllowed).toEqual(["md5","sha1","sha224","sha256","sha384","sha512"]);
    expect(p.tagFilesAllowed).toEqual(["*"]);
    expect(p.serialization).toEqual("optional");
}

function expectedStandardObject() {
    return {
      "Accept-BagIt-Version": [
        "0.97",
        "1.0"
      ],
      "Accept-Serialization": [
        "application/tar"
      ],
      "Allow-Fetch.txt": false,
      "Serialization": "required",
      "Manifests-Allowed": [
        "md5",
        "sha1",
        "sha224",
        "sha256",
        "sha384",
        "sha512"
      ],
      "Tag-Manifests-Allowed": [
        "md5",
        "sha1",
        "sha224",
        "sha256",
        "sha384",
        "sha512"
      ],
      "Manifests-Required": [
        "md5",
        "sha256"
      ],
      "Tag-Manifests-Required": [
        "md5",
        "sha256"
      ],
      "Tag-Files-Allowed": [
        "*"
      ],
      "BagIt-Profile-Info": {
        "BagIt-Profile-Identifier": "https://wiki.aptrust.org/APTrust_BagIt_Profile-2.2",
        "BagIt-Profile-Version": "",
        "Contact-Email": "support@aptrust.org",
        "Contact-Name": "A. Diamond",
        "External-Description": "BagIt profile for ingesting content into APTrust. Updated November 9, 2018.",
        "Source-Organization": "aptrust.org",
        "Version": "2.2"
      },
      "Bag-Info": {
        "Source-Organization": {
          "required": true
        },
        "Bag-Count": {
          "required": false
        },
        "Bag-Size": {
          "required": false
        },
        "Bagging-Date": {
          "required": false
        },
        "Bagging-Software": {
          "required": false,
          "values": [
            "DART",
            "TRAD"
          ]
        },
        "Bag-Group-Identifier": {
          "required": false
        },
        "Internal-Sender-Description": {
          "required": false
        },
        "Internal-Sender-Identifier": {
          "required": false
        },
        "Payload-Oxum": {
          "required": false
        }
      },
      "Tag-Files-Required": [
        "aptrust-info.txt"
      ]
    }
}
