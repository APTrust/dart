const fs = require('fs');
const os = require('os');
const path = require('path');
const { Util } = require('./util');

test('Util.uuid4()', () => {
    let uuid = Util.uuid4();
    expect(uuid.length).toEqual(36);
    expect(uuid).toMatch(/^([a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}?)$/i);
});

test('Util.unicodeByteLength()', () => {
    expect(Util.unicodeByteLength("My mama told me you better shop around")).toEqual(38);
    expect(Util.unicodeByteLength("Οὐχὶ ταὐτὰ παρίσταταί μοι γιγνώσκειν, ὦ ἄνδρες ᾿Αθηναῖοι")).toEqual(115);
    expect(Util.unicodeByteLength("總統是一個道德品質低下的人，不適合任職")).toEqual(57);
});

test('Util.looksLikeUUID()', () => {
    let uuidV4 = "bf24a457-2d19-47c5-b3f5-a54a8cc790f7";
    let uuidV1 = "5ecc6bc8-91b1-11e8-9eb6-529269fb1459";
    expect(Util.looksLikeUUID(uuidV4)).toEqual(true);
    expect(Util.looksLikeUUID(uuidV1)).toEqual(true);
    expect(Util.looksLikeUUID("ταὐτὰ παρίσταταί")).toEqual(false);
    expect(Util.looksLikeUUID("")).toEqual(false);
    expect(Util.looksLikeUUID(null)).toEqual(false);
});

test('Util.isEmpty()', () => {
    expect(Util.isEmpty("")).toEqual(true);
    expect(Util.isEmpty("  ")).toEqual(true);
    expect(Util.isEmpty(null)).toEqual(true);
    expect(Util.isEmpty(" ;) ")).toEqual(false);
});

test('Util.isEmptyStringArray()', () => {
    expect(Util.isEmptyStringArray(null)).toEqual(true);
    expect(Util.isEmptyStringArray([])).toEqual(true);
    expect(Util.isEmptyStringArray(["", null, "", "   "])).toEqual(true);
    expect(Util.isEmptyStringArray([null, null, "yo!", ""])).toEqual(false);
});

test('Util.filterEmptyStrings()', () => {
    let original = ["", null, "  ", "hello", "   ", "world", null];
    let filtered = ["hello", "world"];
    expect(Util.filterEmptyStrings(original)).toEqual(filtered);
});

test('Util.listContains()', () => {
    let list = ["", null, "yes", "spaghetti", "rain", "false"];
    expect(Util.listContains(list, "spaghetti")).toEqual(true);
    expect(Util.listContains(list, "linguini")).toEqual(false);
    // true matches "yes"
    expect(Util.listContains(list, true)).toEqual(true);
    // false matches "false"
    expect(Util.listContains(list, false)).toEqual(true);
});

test('Util.getSortFunction()', () => {
    let objList = [
        { name: 'one', value: 1 },
        { name: 'six', value: 6 },
        { name: 'four', value: 4 }
    ];
    let nameAsc = Util.getSortFunction('name', 'asc');
    expect(typeof nameAsc).toEqual('function');
    objList.sort(nameAsc);
    expect(objList[0].name).toEqual('four')
    expect(objList[1].name).toEqual('one')
    expect(objList[2].name).toEqual('six')

    let nameDesc = Util.getSortFunction('name', 'desc');
    expect(typeof nameDesc).toEqual('function');
    objList.sort(nameDesc);
    expect(objList[0].name).toEqual('six')
    expect(objList[1].name).toEqual('one')
    expect(objList[2].name).toEqual('four')

    let valueAsc = Util.getSortFunction('value', 'asc');
    expect(typeof valueAsc).toEqual('function');
    objList.sort(valueAsc);
    expect(objList[0].value).toEqual(1)
    expect(objList[1].value).toEqual(4)
    expect(objList[2].value).toEqual(6)

    let valueDesc = Util.getSortFunction('value', 'desc');
    expect(typeof valueDesc).toEqual('function');
    objList.sort(valueDesc);
    expect(objList[0].value).toEqual(6)
    expect(objList[1].value).toEqual(4)
    expect(objList[2].value).toEqual(1)
});

test('Util.boolEqual()', () => {
    expect(Util.boolEqual(true, true)).toEqual(true);
    expect(Util.boolEqual(true, "True")).toEqual(true);
    expect(Util.boolEqual(true, "Yes")).toEqual(true);
    expect(Util.boolEqual(false, false)).toEqual(true);
    expect(Util.boolEqual(false, "False")).toEqual(true);
    expect(Util.boolEqual(false, "No")).toEqual(true);

    expect(Util.boolEqual(true, "random word")).toEqual(false);
    expect(Util.boolEqual(false, "random word")).toEqual(false);
});

test('Util.boolValue()', () => {
    expect(Util.boolValue(true)).toEqual(true);
    expect(Util.boolValue("True")).toEqual(true);
    expect(Util.boolValue("Yes")).toEqual(true);
    expect(Util.boolValue(false)).toEqual(false);
    expect(Util.boolValue("False")).toEqual(false);
    expect(Util.boolValue("No")).toEqual(false);
    expect(Util.boolValue("random word")).toBeNull();
});

test('Util.toHumanSize()', () => {
    expect(Util.toHumanSize(893367)).toEqual("872.43 KB");
    expect(Util.toHumanSize(38555662)).toEqual("36.77 MB");
    expect(Util.toHumanSize(555555555556)).toEqual("517.40 GB");
    expect(Util.toHumanSize(34567893456789)).toEqual("31.44 TB");
});

test('Util.truncateString()', () => {
    let original = "This string will be truncated to a shorter length.";
    let truncated = "This string..."
    expect(Util.truncateString(original, 12)).toEqual(truncated);
    expect(Util.truncateString(original, 500)).toEqual(original);
});

test('Util.windowsToBagItPath()', () => {
    expect(Util.normalizeWindowsPath("C:\\Users\\sally")).toEqual("/Users/sally");
    expect(Util.normalizeWindowsPath("\\remote\\sally")).toEqual("/remote/sally");
});

test('Util.walkSync()', () => {
    // List all files in and below the current directory.
    let files = Util.walkSync(__dirname, null);
    expect(files.length).toBeGreaterThan(6);
    let thisFile = files.filter(f => f.absPath == __filename);
    expect(thisFile.length).toEqual(1);
    let originalListLength = files.length;

    // Tell walkSync to filter the current file from the list
    let filterFunction = function(filename) { return filename != __filename; }
    files = Util.walkSync(__dirname, filterFunction);
    expect(files.length).toEqual(originalListLength - 1);
    thisFile = files.filter(f => f.absPath == __filename);
    expect(thisFile.length).toEqual(0);
});

test('Util.deleteRecursive()', () => {
    var dir1 = path.join(os.tmpdir(), 'dart-util-test');
    var dir2 = path.join(dir1, 'subdir');
    var file1 = path.join(dir1, path.basename(__filename));
    var file2 = path.join(dir2, path.basename(__filename));

    if (!fs.existsSync(dir1)) {
        fs.mkdirSync(dir1);
    }
    if (!fs.existsSync(dir2)) {
        fs.mkdirSync(dir2);
    }

    fs.copyFileSync(__filename, file1);
    fs.copyFileSync(__filename, file2);

    expect(fs.existsSync(dir1)).toEqual(true);
    expect(fs.existsSync(dir2)).toEqual(true);
    expect(fs.existsSync(file1)).toEqual(true);
    expect(fs.existsSync(file2)).toEqual(true);

    Util.deleteRecursive(dir1);
    expect(fs.existsSync(dir1)).toEqual(false);
    expect(fs.existsSync(dir2)).toEqual(false);
    expect(fs.existsSync(file1)).toEqual(false);
    expect(fs.existsSync(file2)).toEqual(false);

    // Sanity check - we should not be able to delete
    // anything too close to the root of the filesystem
    expect(() => {
        Util.deleteRecursive('/no/no');
    }).toThrow('/no/no does not look safe to delete');

    // Should not throw if dir does not exist
    expect(() => {
        Util.deleteRecursive('/no/no/-255a7796e602-');
    }).not.toThrow();

});
