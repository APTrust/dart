const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { AppSetting } = require('./app_setting');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeEach(() => {
    TestUtil.deleteJsonFile('AppSetting');
});

test('Constructor sets expected properties', () => {
    let obj = new AppSetting('name1', 'value1');
    expect(obj.type).toEqual('AppSetting');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(obj.name).toEqual('name1');
    expect(obj.value).toEqual('value1');
    expect(obj.userCanDelete).toEqual(true);
});


test('validate()', () => {
    let obj = new AppSetting('', '');
    let result1 = obj.validate();
    expect(result1.isValid()).toEqual(false);
    expect(result1.errors['name']).toEqual('Name cannot be empty');

    let originalId = obj.id;
    obj.id = null; // never do this!
    let result2 = obj.validate();
    expect(result2.isValid()).toEqual(false);
    expect(result2.errors['name']).toEqual('Name cannot be empty');
    expect(result2.errors['id']).toEqual('Id cannot be empty');

    obj.name = 'Something';
    obj.id = originalId;
    let result3 = obj.validate();
    expect(result3.isValid()).toEqual(true);
});

test('find()', () => {
    let objs = makeObjects(3);
    let obj = objs[1];
    expect(AppSetting.find(obj.id)).toEqual(obj);
});

test('sort()', () => {
    let objs = makeObjects(3);
    let sortedAsc = AppSetting.sort("name", "asc");
    expect(sortedAsc[0].name).toEqual("Name 1");
    expect(sortedAsc[2].name).toEqual("Name 3");
    let sortedDesc = AppSetting.sort("name", "desc");
    expect(sortedDesc[0].name).toEqual("Name 3");
    expect(sortedDesc[2].name).toEqual("Name 1");
});

test('findMatching()', () => {
    let objs = makeObjects(3);
    let matches = AppSetting.findMatching("value", "Value 3");
    expect(matches.length).toEqual(1);
    expect(matches[0].value).toEqual("Value 3");
});

test('firstMatching()', () => {
    let objs = makeObjects(3);
    let match = AppSetting.firstMatching("value", "Value 3");
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
    let matches = AppSetting.list(fn, opts);
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
    let match = AppSetting.first(fn, opts);
    expect(match).not.toBeNull();
    expect(match.value).toEqual("Value 3");
});

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let name = `Name ${i + 1}`;
        let value = `Value ${i + 1}`;
        let obj = new AppSetting(name, value);
        obj.save();
        list.push(obj);
    }
    return list;
}
