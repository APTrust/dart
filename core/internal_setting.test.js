const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { InternalSetting } = require('./internal_setting');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeEach(() => {
    TestUtil.deleteJsonFile('InternalSetting');
});

afterAll(() => {
    TestUtil.deleteJsonFile('InternalSetting');
});

test('Constructor sets expected properties', () => {
    let obj = new InternalSetting({ name: 'name1', value: 'value1' });
    expect(obj.type).toEqual('InternalSetting');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(obj.name).toEqual('name1');
    expect(obj.value).toEqual('value1');
    expect(obj.userCanDelete).toEqual(true);
});


test('validate()', () => {
    let obj = new InternalSetting();
    let result1 = obj.validate();
    expect(result1).toEqual(false);
    expect(obj.errors['name']).toEqual('Name cannot be empty.');

    let originalId = obj.id;
    obj.id = null; // never do this!
    let result2 = obj.validate();
    expect(result2).toEqual(false);
    expect(obj.errors['name']).toEqual('Name cannot be empty.');
    expect(obj.errors['id']).toEqual('Id cannot be empty.');

    obj.name = 'Something';
    obj.id = originalId;
    let result3 = obj.validate();
    expect(result3).toEqual(true);
});

test('find()', () => {
    let objs = makeObjects(3);
    let obj = objs[1];
    expect(InternalSetting.find(obj.id)).toEqual(obj);
});

test('sort()', () => {
    let objs = makeObjects(3);
    let sortedAsc = InternalSetting.sort("name", "asc");
    expect(sortedAsc[0].name).toEqual("Name 1");
    expect(sortedAsc[2].name).toEqual("Name 3");
    let sortedDesc = InternalSetting.sort("name", "desc");
    expect(sortedDesc[0].name).toEqual("Name 3");
    expect(sortedDesc[2].name).toEqual("Name 1");
});

test('findMatching()', () => {
    let objs = makeObjects(3);
    let matches = InternalSetting.findMatching("value", "Value 3");
    expect(matches.length).toEqual(1);
    expect(matches[0].value).toEqual("Value 3");
});

test('firstMatching()', () => {
    let objs = makeObjects(3);
    let match = InternalSetting.firstMatching("value", "Value 3");
    expect(match).not.toBeNull();
    expect(match.value).toEqual("Value 3");
});

test('list()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.value != null;
    }
    let opts = {
        limit: 2,
        offset: 1,
        orderBy: "value",
        sortDirection: "asc"
    }
    let matches = InternalSetting.list(fn, opts);
    expect(matches.length).toEqual(2);
    expect(matches[0].value).toEqual("Value 2");
    expect(matches[1].value).toEqual("Value 3");
});

test('first()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.value != null;
    }
    let opts = {
        orderBy: "value",
        sortDirection: "desc"
    }
    let match = InternalSetting.first(fn, opts);
    expect(match).not.toBeNull();
    expect(match.value).toEqual("Value 3");
});

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let name = `Name ${i + 1}`;
        let value = `Value ${i + 1}`;
        let obj = new InternalSetting({ name: name, value: value });
        obj.save();
        list.push(obj);
    }
    return list;
}
