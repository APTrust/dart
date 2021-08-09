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

test('Util.looksLikeHyperTextURL()', () => {
    expect(Util.looksLikeHypertextURL("http://example.com/api")).toEqual(true);
    expect(Util.looksLikeHypertextURL("http://localhost/api")).toEqual(true);
    expect(Util.looksLikeHypertextURL("https://repo.example.com/api/v2")).toEqual(true);
    expect(Util.looksLikeHypertextURL("ftp://example.com/upload")).toEqual(false);
    expect(Util.looksLikeHypertextURL("ταὐτὰ παρίσταταί")).toEqual(false);
    expect(Util.looksLikeHypertextURL("")).toEqual(false);
    expect(Util.looksLikeHypertextURL(null)).toEqual(false);
    expect(Util.looksLikeHypertextURL(6)).toEqual(false);
});

test('Util.isEmpty()', () => {
    expect(Util.isEmpty("")).toEqual(true);
    expect(Util.isEmpty("  ")).toEqual(true);
    expect(Util.isEmpty(null)).toEqual(true);
    expect(Util.isEmpty(" ;) ")).toEqual(false);
});

test('Util.camelToTitle()', () => {
    expect(Util.camelToTitle("myVarName")).toEqual("My Var Name");
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
    expect(Util.boolValue("random word")).toBeUndefined();
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

test('Util.escapeBackslashes()', () => {
    expect(Util.escapeBackslashes("C:\\Users\\sally")).toEqual("C:\\\\Users\\\\sally");
});

test('Util.normalizeWindowsPath()', () => {
    expect(Util.normalizeWindowsPath("C:\\Users\\sally")).toEqual("/Users/sally");
    expect(Util.normalizeWindowsPath("\\remote\\sally")).toEqual("/remote/sally");
});

test('Util.removeWindowsDrivePrefix()', () => {
    expect(Util.removeWindowsDrivePrefix("C:\\Users\\sally")).toEqual("\\Users\\sally");
    expect(Util.removeWindowsDrivePrefix("\\\\share\\remote\\sally")).toEqual("\\remote\\sally");
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
        let fakePath = path.join('no', 'no', '-255a7796e602-');
        Util.deleteRecursive(fakePath);
    }).not.toThrow();

});

test('Util.bagNameFromPath()', () => {
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.7z')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.s7z')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.bz')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.bz2')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.gz')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.par')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.par2')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tar')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tar.gz')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tgz')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tar.Z')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tar.bz')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.tar.bz2')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.zip')).toEqual('bag_of_photos');
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.zipx')).toEqual('bag_of_photos');

    // Should not trim off unrecognized extension
    expect(Util.bagNameFromPath('/var/tmp/bag_of_photos.123')).toEqual('bag_of_photos.123');
});

test('Util.cast()', () => {
     expect(Util.cast('false', 'boolean')).toBe(false);
     expect(Util.cast('yes', 'boolean')).toBe(true);
     expect(Util.cast('1', 'boolean')).toBe(true);
     expect(Util.cast('3', 'number')).toBe(3);
     expect(Util.cast('3.14', 'number')).toBe(3.14);
});

test('Util.lcFirst()', () => {
     expect(Util.lcFirst('Homer')).toEqual('homer');
     expect(Util.lcFirst('')).toEqual('');
     expect(Util.lcFirst(null)).toBeNull();
});

test('Util.deleteFromArray()', () => {
    let numbers = [1,2,3,4,5,6];

    // 100 is not in array, so this should delete nothing.
    Util.deleteFromArray(numbers, 100);
    expect(numbers).toEqual([1,2,3,4,5,6]);

    // Should delete
    Util.deleteFromArray(numbers, 4);
    expect(numbers).toEqual([1,2,3,5,6]);

    let names = ['Homer', 'Marge', 'Bart', 'Lisa', 'Lenny', 'Carl'];
    Util.deleteFromArray(names, 'Barney');
    expect(names).toEqual(['Homer', 'Marge', 'Bart', 'Lisa', 'Lenny', 'Carl']);

    Util.deleteFromArray(names, 'Lenny');
    expect(names).toEqual(['Homer', 'Marge', 'Bart', 'Lisa', 'Carl']);
});

test('Util.looksLikeEnvSetting()', () => {
    expect(Util.looksLikeEnvSetting('env:HOSTNAME')).toBe(true);
    expect(Util.looksLikeEnvSetting('example.com')).toBe(false);
});

test('Util.getEnvSetting()', () => {
    expect(Util.getEnvSetting('env:PATH')).toEqual(process.env.PATH);
    expect(Util.getEnvSetting('invalid_var')).toBeUndefined();
});

test('Util.tmpFilePath()', () => {
    let path = Util.tmpFilePath();
    // Make this work on Windows in addition to sane,
    // well-designed operating systems.
    let tmpDir = Util.escapeBackslashes(os.tmpdir());
    expect(path).toMatch(new RegExp(`^${tmpDir}`));
    expect(path).toMatch(/[a-f0-9]{8}_\d{13}$/);
});

test('Util.arrayContentsMatch()', () => {
    // No match because they're not arrays.
    var a, b; // both undefined
    expect(Util.arrayContentsMatch(a, b, false)).toBe(false);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(false);

    // No match because they're not arrays.
    a = null, b = null;
    expect(Util.arrayContentsMatch(a, b, false)).toBe(false);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(false);

    // No match because they're not arrays.
    a = 1, b = 1;
    expect(Util.arrayContentsMatch(a, b, false)).toBe(false);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(false);

    // Different contents.
    a = [1], b = [2];
    expect(Util.arrayContentsMatch(a, b, false)).toBe(false);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(false);

    // Same contents, different orders.
    // The match only when orderMatters == false.
    a = ['Homer', 'Marge', 'Lisa'], b = ['Lisa', 'Marge', 'Homer'];
    expect(Util.arrayContentsMatch(a, b, false)).toBe(true);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(false);

    // Same contents, same order.
    a = ['Homer', 'Marge', 'Lisa'], b = ['Homer', 'Marge', 'Lisa'];
    expect(Util.arrayContentsMatch(a, b, false)).toBe(true);
    expect(Util.arrayContentsMatch(a, b, true)).toBe(true);
});

test('Util.canRead()', () => {
    let testDir = path.join(__dirname, '..', 'test', 'files');
    expect(Util.canRead(path.join(testDir, 'unwritable.txt'))).toBe(true);
    expect(Util.canRead(path.join(testDir, 'readwrite.txt'))).toBe(true);
    expect(Util.canRead(path.join(testDir, 'does-not-exist.txt'))).toBe(false);
});

test('Util.canWrite()', () => {
    let testDir = path.join(__dirname, '..', 'test', 'files');
    fs.chmodSync(path.join(testDir, 'unwritable.txt'), 0o444);
    expect(Util.canWrite(path.join(testDir, 'unwritable.txt'))).toBe(false);
    expect(Util.canRead(path.join(testDir, 'readwrite.txt'))).toBe(true);
    expect(Util.canWrite(path.join(testDir, 'does-not-exist.txt'))).toBe(false);
});

test('Util.isDirectory()', () => {
    expect(Util.isDirectory(__dirname)).toBe(true)
    expect(Util.isDirectory(__dirname + 'zzzz8080')).toBe(false)
    expect(Util.isDirectory('')).toBe(false)
});

test('Util.isNonEmptyDirectory()', () => {
    expect(Util.isNonEmptyDirectory(__dirname)).toBe(true)
    expect(Util.isNonEmptyDirectory(__dirname + 'zzzz8080')).toBe(false)
    expect(Util.isNonEmptyDirectory('')).toBe(false)
});

test('Util.findCommonPathPrefix()', () => {
    let posixPaths = [
        "/path/to/some/file.txt",
        "/path/to/some/other/document.pdf",
        "/path/to/some/different/photo.jpg"
    ]
    let windowsPaths = [
        "c:\\path\\to\\some\\file.txt",
        "c:\\path\\to\\some\\other\\file.txt",
        "c:\\path\\to\\some\\different\\file.txt",
    ]
    let nothingInCommon = [
        "/path/to/some/file.txt",
        "/dont/have/a/cow",
        "c:\\one\\two\\three\\four"
    ];

    expect(Util.findCommonPathPrefix(posixPaths, '/')).toEqual("/path/to/some/");
    expect(Util.findCommonPathPrefix(windowsPaths, '\\')).toEqual("c:\\path\\to\\some\\");
    expect(Util.findCommonPathPrefix(nothingInCommon, '/')).toEqual('');
});

test('Util.trimToLength()', () => {
    let str = "Did the solution require a complex prediction, or is the solution clear and closely related to the problem?";
    expect(Util.trimToLength(str, 30, 'end')).toEqual("Did the solution require a co...");
    expect(Util.trimToLength(str, 30, 'middle')).toEqual("Did the sol...to the problem?");
});

test('Util.formatError()', () => {
    expect(Util.formatError('abc')).toEqual('abc')
    let err = new Error("Normal JS error");
    expect(Util.formatError(err)).toEqual("Normal JS error")
    let sysError = {
        code: 'Jenny',
        syscall: '867-5309',
        path: 'I got your number'
    }
    expect(Util.formatError(sysError)).toContain("Jenny")
    expect(Util.formatError(sysError)).toContain("I got your number")
    expect(Util.formatError(sysError)).toContain("867-5309")
    let randomObj = {
        one: 1,
        two: 2
    }
    expect(Util.formatError(randomObj)).toEqual(`{"one":1,"two":2}`)
});
