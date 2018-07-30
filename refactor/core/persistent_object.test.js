const fs = require('fs');
//const os = require('os');
const path = require('path');
//const { Config } = require('./config');
const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { Util } = require('./util');

beforeEach(() => {
    deleteJsonFiles();
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
});

test('validate() throws error because it must be implemented in derived class', () => {
    let obj = new PersistentObject('test1');
    expect(() => { obj.validate() }).toThrow(Error);
});

test('Basic operations: save(), find(), delete()', () => {
    // Make sure we can save an object withouth error.
    let obj = new PersistentObject('test1');
    expect(() => { obj.save() }).not.toThrow(Error);
    let saved = obj.save();
    expect(saved).toEqual(obj);

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
    expect(refoundObject).toBeUndefined();
})

test('mergeDefaultOptions()', () => {
    var opts1 = PersistentObject.mergeDefaultOpts();
    expect(opts1).not.toBeNull();
    expect(opts1.limit).toEqual(0);
    expect(opts1.offset).toEqual(0);
    expect(opts1.orderBy).toBeNull();
    expect(opts1.sortDirection).toEqual('asc');

    var opts2 = PersistentObject.mergeDefaultOpts({});
    expect(opts2).not.toBeNull();
    expect(opts2.limit).toEqual(0);
    expect(opts2.offset).toEqual(0);
    expect(opts2.orderBy).toBeNull();
    expect(opts2.sortDirection).toEqual('asc');

    var opts3 = PersistentObject.mergeDefaultOpts({
        'limit': 20,
        'offset': 50,
        'orderBy': 'name',
        'sortDirection': 'desc'
    });
    expect(opts3).not.toBeNull();
    expect(opts3.limit).toEqual(20);
    expect(opts3.offset).toEqual(50);
    expect(opts3.orderBy).toEqual('name');
    expect(opts3.sortDirection).toEqual('desc');
});

test('sort()', () => {
    let list = makeObjects('test1', 10);
    expect(list.length).toEqual(10);
    let db = Context.db('test1');

    let nameAsc = PersistentObject.sort(db, 'name', 'asc');
    expect(nameAsc.length).toEqual(10);
    expect(nameAsc[0].name).toEqual('Object 1');
    expect(nameAsc[9].name).toEqual('Object 9');

    let nameDesc = PersistentObject.sort(db, 'name', 'desc');
    expect(nameDesc.length).toEqual(10);
    expect(nameDesc[0].name).toEqual('Object 9');
    expect(nameDesc[9].name).toEqual('Object 1');

    let ageAsc = PersistentObject.sort(db, 'age', 'asc');
    expect(ageAsc.length).toEqual(10);
    expect(ageAsc[0].age).toEqual(50);
    expect(ageAsc[9].age).toEqual(95);

    let ageDesc = PersistentObject.sort(db, 'age', 'desc');
    expect(ageDesc.length).toEqual(10);
    expect(ageDesc[0].age).toEqual(95);
    expect(ageDesc[9].age).toEqual(50);

    let unsorted1 = PersistentObject.sort(db, null, 'desc');
    expect(unsorted1).toEqual(list);

    let unsorted2 = PersistentObject.sort(db, '');
    expect(unsorted2).toEqual(list);
});

test('findMatching()', () => {
    let list = makeObjects('test2', 10);
    expect(list.length).toEqual(10);
    let db = Context.db('test2');

    let matches = PersistentObject.findMatching(db, 'name', 'Object 1');
    expect(matches.length).toEqual(1);
    expect(matches[0].name).toEqual('Object 1');

    // In this case, all records will match name == 'Agent 99'.
    // Make sure we get just four records (limit = 4, that they
    // are in the correct order, and that we skip the first two (offset = 2).
    let newList = list.map(obj => { obj.name = 'Agent 99'; obj.save(); });
    let opts = {
        'limit': 4,
        'offset': 2,
        'orderBy': 'age',
        'sortDirection': 'desc'
    };
    matches = PersistentObject.findMatching(db, 'name', 'Agent 99', opts);
    expect(matches.length).toEqual(4);
    for(var m of matches) {
        expect(m.name).toEqual('Agent 99');
    }
    expect(matches[0].age).toEqual(85);
    expect(matches[1].age).toEqual(80);
    expect(matches[2].age).toEqual(75);
    expect(matches[3].age).toEqual(70);
});

test('firstMatching()', () => {

});

test('list()', () => {

});

test('first()', () => {

});

function makeObjects(type, howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let obj = new PersistentObject(type);
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
            if (f.endsWith('.json')) {
                let jsonFile = path.join(Context.config.dataDir, f);
                fs.unlinkSync(jsonFile);
            }
        }
    }
}
