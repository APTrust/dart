const fs = require('fs');
//const os = require('os');
const path = require('path');
//const { Config } = require('./config');
const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

beforeEach(() => {
    //deleteJsonFiles();
});

test('Constructor throws error if type is missing or empty', () => {
    expect(() => { new PersistentObject() }).toThrow(Error);
    expect(() => { new PersistentObject(null) }).toThrow(Error);
    expect(() => { new PersistentObject('') }).toThrow(Error);
    expect(() => { new PersistentObject('  ') }).toThrow(Error);
});

test('Constructor sets expected properties', () => {
    let obj = new PersistentObject('test1');
    expect(obj.type).toEqual('test1');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    //expect(po.db).not.toBeNull();
    //expect(po.db.path.includes(path.join('.dart-test', 'data'))).toEqual(true);
});

test('validate() throws error because it must be implemented in derived class', () => {
    let obj = new PersistentObject('test1');
    expect(() => { obj.validate() }).toThrow(Error);
});

test('Basic operations: save(), find(), delete()', () => {
    // Make sure we can save an object withouth error.
    let obj = new PersistentObject('test1');
    expect(() => { obj.save() }).not.toThrow(Error);

    // Make sure the Context created the db to store the object.
    let db = Context.db(obj.type);
    expect(db).not.toBeNull();
    expect(db.path.endsWith(path.join('.dart-test', 'data', 'test1.json'))).toEqual(true);
    expect(fs.existsSync(db.path)).toEqual(true);

    // Make sure we can retrieve the saved object.
    let foundObject = PersistentObject.find(db, obj.id);
    expect(foundObject).not.toBeNull();
    expect(foundObject).not.toBeUndefined();
    expect(foundObject.id).toEqual(obj.id);

    // Make sure delete returns and deletes the object.
    let deletedObject = obj.delete();
    expect(deletedObject.id).toEqual(obj.id);
    let refoundObject = PersistentObject.find(db, obj.id);
    console.log(refoundObject);
    expect(refoundObject).toBeUndefined();
})

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let obj = new PersistentObject('test1');
        obj.name = `Object ${i + 1}`;
        obj.age = 100 - ((i + 1) * 5);
        obj.save();
        list.push(obj);
    }
    return list;
}

function deleteJsonFiles() {
    if (Context.isTestEnv && Context.config.dataDir.includes(path.join('.dart-test', 'data'))) {
        for (var f of fs.readdirSync(Context.config.dataDir)) {
            console.log(f);
            if (f.endsWith('.json')) {
                //fs.unlinkSync(f);
            }
        }
    }
}
