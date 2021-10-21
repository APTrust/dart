const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { StorageService } = require('./storage_service');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeEach(() => {
    TestUtil.deleteJsonFile('StorageService');
});

afterAll(() => {
    TestUtil.deleteJsonFile('StorageService');
});

test('Constructor sets expected properties', () => {
    let obj = new StorageService({ name: 'name1'});
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(obj.name).toEqual('name1');
    expect(obj.allowsUpload).toBe(true);
    expect(obj.allowsDownload).toBe(true);
});


test('validate()', () => {
    let obj = new StorageService();
    let originalId = obj.id;
    obj.id = null;
    obj.port = 'Port of Spain';
    let result1 = obj.validate();
    expect(result1).toEqual(false);
    expect(obj.errors['name']).toEqual('Name cannot be empty.');
    expect(obj.errors['id']).toEqual('Id cannot be empty.');
    expect(obj.errors['protocol']).toEqual('Protocol cannot be empty.');
    expect(obj.errors['host']).toEqual('Host cannot be empty.');
    expect(obj.errors['port']).toEqual('Port must be a whole number, or leave at zero to use the default port.');

    obj.id = originalId;
    obj.name = 'Something';
    obj.protocol = 's3';
    obj.host = 's3.amazonaws.com';
    obj.port = null;
    expect(obj.validate()).toEqual(true);
    obj.port = 443;
    expect(obj.validate()).toEqual(true);
});

test('validate() forces empty port to zero', () => {
    let obj = new StorageService();
    obj.port = ""
    expect(obj.port).toBe("")

    // We're testing a specific side-effect here.
    // validate(), which is always called before save,
    // forces empty string to zero. We do this so that
    // workflows containing storage service records don't
    // serialize the port as "". dart-runner expects an
    // integer in this field, not a string. If it doesn't
    // find an int, it won't run the worklfow.
    obj.validate()
    expect(obj.port).toBe(0)
});


test('url()', () => {
    let obj = new StorageService();
    obj.protocol = 's3';
    obj.host = 's3.amazonaws.com';
    obj.port = 0;
    obj.bucket = 'aptrust.test.test.edu';
    expect(obj.url()).toEqual('s3://s3.amazonaws.com/aptrust.test.test.edu/');
    expect(obj.url('bag.tar')).toEqual('s3://s3.amazonaws.com/aptrust.test.test.edu/bag.tar');

    obj.protocol = 'ftp';
    obj.host = 'example.com';
    obj.port = 5678;
    obj.bucket = 'uploads';
    expect(obj.url()).toEqual('ftp://example.com:5678/uploads/');
    expect(obj.url('bag.tar')).toEqual('ftp://example.com:5678/uploads/bag.tar');
});

test('hasPlaintextLogin()', () => {
    let ss = new StorageService();
    expect(ss.hasPlaintextLogin()).toBe(false)
    ss.login = "env:API_LOGIN"
    expect(ss.hasPlaintextLogin()).toBe(false)
    ss.login = "user@example.com"
    expect(ss.hasPlaintextLogin()).toBe(true)
});

test('hasPlaintextPassword()', () => {
    let ss = new StorageService();
    expect(ss.hasPlaintextPassword()).toBe(false)
    ss.password = "env:API_PASSWORD"
    expect(ss.hasPlaintextPassword()).toBe(false)
    ss.password = "user@example.com"
    expect(ss.hasPlaintextPassword()).toBe(true)
});

test('find()', () => {
    let objs = makeObjects(3);
    let obj = objs[1];
    expect(StorageService.find(obj.id)).toEqual(obj);
});

test('sort()', () => {
    let objs = makeObjects(3);
    let sortedAsc = StorageService.sort("name", "asc");
    expect(sortedAsc[0].name).toEqual("Name 1");
    expect(sortedAsc[2].name).toEqual("Name 3");
    let sortedDesc = StorageService.sort("name", "desc");
    expect(sortedDesc[0].name).toEqual("Name 3");
    expect(sortedDesc[2].name).toEqual("Name 1");
});

test('findMatching()', () => {
    let objs = makeObjects(3);
    let matches = StorageService.findMatching("host", "Host 3");
    expect(matches.length).toEqual(1);
    expect(matches[0].host).toEqual("Host 3");
    matches = StorageService.findMatching("protocol", "s3");
    expect(matches.length).toEqual(2);
    matches = StorageService.findMatching("protocol", "sneakernet");
    expect(matches.length).toEqual(0);
});

test('firstMatching()', () => {
    let objs = makeObjects(3);
    let match = StorageService.firstMatching("protocol", "sftp");
    expect(match).not.toBeNull();
    expect(match.protocol).toEqual("sftp");
});

test('list()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.host != null;
    }
    let opts = {
        limit: 2,
        offset: 1,
        orderBy: "host",
        sortDirection: "asc"
    }
    let matches = StorageService.list(fn, opts);
    expect(matches.length).toEqual(2);
    expect(matches[0].host).toEqual("Host 2");
    expect(matches[1].host).toEqual("Host 3");
});

test('first()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.host != null;
    }
    let opts = {
        orderBy: "host",
        sortDirection: "desc"
    }
    let match = StorageService.first(fn, opts);
    expect(match).not.toBeNull();
    expect(match.host).toEqual("Host 3");
});


test('getValue()', () => {
    let service = new StorageService({ name: 'example'});
    service.login = 'user@example.com';
    expect(service.getValue('login')).toEqual('user@example.com');

    // PATH is common to Windows, Mac, Linux
    service.login = 'env:PATH';
    expect(service.getValue('login')).toEqual(process.env.PATH);
});

test('inflateFrom()', () => {
    let data = { name: 'My S3 bucket', url: 'https://s3.example.com' };
    let ss = StorageService.inflateFrom(data);
    expect(ss).toBeTruthy();
    expect(ss.constructor.name).toEqual('StorageService');
    expect(ss.name).toEqual(data.name);
    expect(ss.url).toEqual(data.url);
});

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let name = `Name ${i + 1}`;
        let obj = new StorageService({ name: name });
        obj.host = `Host ${i + 1}`;
        if (i % 2 == 0) {
            obj.protocol = 's3';
        } else {
            obj.protocol = 'sftp';
        }
        obj.save();
        list.push(obj);
    }
    return list;
}
