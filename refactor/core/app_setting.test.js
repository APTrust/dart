const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { AppSetting } = require('./app_setting');
const { Util } = require('./util');

beforeEach(() => {
    deleteJsonFiles();
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

// test('find()', () => {

// });

// test('validate()', () => {

// });

// test('sort()', () => {

// });

// test('findMatching()', () => {

// });

// test('firstMatching()', () => {

// });

// test('list()', () => {

// });

// test('first()', () => {

// });

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


function deleteJsonFiles() {
    if (Context.isTestEnv && Context.config.dataDir.includes(path.join('.dart-test', 'data'))) {
        for (var f of fs.readdirSync(Context.config.dataDir)) {
            if (f.endsWith('AppSetting.json')) {
                let jsonFile = path.join(Context.config.dataDir, f);
                fs.unlinkSync(jsonFile);
            }
        }
    }
}
