const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { RemoteRepository } = require('./remote_repository');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeEach(() => {
    TestUtil.deleteJsonFile('RemoteRepository');
});

afterAll(() => {
    TestUtil.deleteJsonFile('RemoteRepository');
});

test('Constructor sets expected properties', () => {
    let obj = new RemoteRepository({name: 'name1'});
    expect(obj.type).toEqual('RemoteRepository');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(obj.name).toEqual('name1');
    expect(obj.userCanDelete).toEqual(true);
});


test('validate()', () => {
    let obj = new RemoteRepository();
    let result1 = obj.validate();
    expect(result1).toEqual(false);
    expect(obj.errors['name']).toEqual('Name cannot be empty.');

    let originalId = obj.id;
    obj.id = null; // never do this!
    let result2 = obj.validate();
    expect(result2).toEqual(false);
    expect(obj.errors['name']).toEqual('Name cannot be empty.');
    expect(obj.errors['id']).toEqual('Id cannot be empty.');
    expect(obj.errors['url']).toEqual('Repository URL must a valid URL beginning with http:// or https://.');

    obj.name = 'Something';
    obj.id = originalId;
    obj.url = 'https://example.com/placeholder';
    let result3 = obj.validate();
    expect(result3).toEqual(true);
});

test('find()', () => {
    let objs = makeObjects(3);
    let obj = objs[1];
    expect(RemoteRepository.find(obj.id)).toEqual(obj);
});

test('sort()', () => {
    let objs = makeObjects(3);
    let sortedAsc = RemoteRepository.sort("name", "asc");
    expect(sortedAsc[0].name).toEqual("Name 1");
    expect(sortedAsc[2].name).toEqual("Name 3");
    let sortedDesc = RemoteRepository.sort("name", "desc");
    expect(sortedDesc[0].name).toEqual("Name 3");
    expect(sortedDesc[2].name).toEqual("Name 1");
});

test('findMatching()', () => {
    let objs = makeObjects(3);
    let matches = RemoteRepository.findMatching("url", "https://repo3.example.com");
    expect(matches.length).toEqual(1);
    expect(matches[0].url).toEqual("https://repo3.example.com");
});

test('firstMatching()', () => {
    let objs = makeObjects(3);
    let match = RemoteRepository.firstMatching("url", "https://repo3.example.com");
    expect(match).not.toBeNull();
    expect(match.url).toEqual("https://repo3.example.com");
});

test('list()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.url != null;
    }
    let opts = {
        limit: 2,
        offset: 1,
        orderBy: "url",
        sortDirection: "asc"
    }
    let matches = RemoteRepository.list(fn, opts);
    expect(matches.length).toEqual(2);
    expect(matches[0].url).toEqual("https://repo2.example.com");
    expect(matches[1].url).toEqual("https://repo3.example.com");
});

test('first()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.url != null;
    }
    let opts = {
        orderBy: "url",
        sortDirection: "desc"
    }
    let match = RemoteRepository.first(fn, opts);
    expect(match).not.toBeNull();
    expect(match.url).toEqual("https://repo3.example.com");
});

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let name = `Name ${i + 1}`;
        let value = `Value ${i + 1}`;
        let obj = new RemoteRepository({ name: name });
        obj.url = `https://repo${i + 1}.example.com`;
        obj.save();
        list.push(obj);
    }
    return list;
}
