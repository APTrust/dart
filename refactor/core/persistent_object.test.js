const fs = require('fs');
const path = require('path');
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

test('userCanDelete == false should prevent deletion', () => {
    // Make sure we can save an object withouth error.
    let obj = new PersistentObject('test1');
    obj.userCanDelete = false;
    expect(() => { obj.save() }).not.toThrow(Error);
    obj.save();
    expect(() => { obj.delete() }).toThrow(Error);
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

    // No matches
    matches = PersistentObject.findMatching(db, 'name', 'Schwartzenegger', opts);
    expect(matches.length).toEqual(0);

    // Match on field that doesn't exist.
    matches = PersistentObject.findMatching(db, 'noProperty', 'Object 1', opts);
    expect(matches.length).toEqual(0);
});

test('firstMatching()', () => {
    let list = makeObjects('test3', 10);
    expect(list.length).toEqual(10);
    let db = Context.db('test3');

    let match = PersistentObject.firstMatching(db, 'name', 'Object 1');
    expect(match).not.toBeNull();
    expect(match.name).toEqual('Object 1');

    // We should find only one match, even if we give weird options.
    // That match should be the correct one, given offset and limit.
    let newList = list.map(obj => { obj.name = 'Agent 99'; obj.save(); });
    match = PersistentObject.firstMatching(db, 'name', 'Agent 99');
    expect(match.name).toEqual('Agent 99');
    expect(match.age).toEqual(95);

    // firstMatching should ignore limit and always return at most
    // one object. It should respect the other options. Hence, we
    // get the third record, where age = 85.
    let opts = {
        'limit': 4,
        'offset': 2,
        'orderBy': 'age',
        'sortDirection': 'desc'
    };
    match = PersistentObject.firstMatching(db, 'name', 'Agent 99', opts);
    expect(match.name).toEqual('Agent 99');
    expect(match.age).toEqual(85);

    // No match for this one
    match = PersistentObject.firstMatching(db, 'name', 'Object 1');
    expect(match).toBeNull();

    // Property doesn't exist
    match = PersistentObject.firstMatching(db, 'noProperty', 'Object 1');
    expect(match).toBeNull();
});

test('list()', () => {
    let list = makeObjects('test4', 10);
    expect(list.length).toEqual(10);
    let db = Context.db('test4');

    // Define a filter function
    let fn = function(obj) {
        return obj.name.startsWith('Object') && (obj.age > 60 && obj.age < 85);
    };
    let opts = {
        'orderBy': 'age',
        'sortDirection': 'desc'
    };

    let matches = PersistentObject.list(db, fn, opts);
    expect(matches.length).toEqual(4);
    expect(matches[0].age).toEqual(80);
    expect(matches[1].age).toEqual(75);
    expect(matches[2].age).toEqual(70);
    expect(matches[3].age).toEqual(65);

    // Same query, different sort
    opts.sortDirection = 'asc';
    matches = PersistentObject.list(db, fn, opts);
    expect(matches.length).toEqual(4);
    expect(matches[0].age).toEqual(65);
    expect(matches[1].age).toEqual(70);
    expect(matches[2].age).toEqual(75);
    expect(matches[3].age).toEqual(80);

    // Limit the results, still sorting asc
    opts.offset = 2;
    opts.limit = 2;
    matches = PersistentObject.list(db, fn, opts);
    expect(matches.length).toEqual(2);
    expect(matches[0].age).toEqual(75);
    expect(matches[1].age).toEqual(80);
});

test('first()', () => {
    let list = makeObjects('test5', 10);
    expect(list.length).toEqual(10);
    let db = Context.db('test5');

    // Define a filter function
    let fn = function(obj) {
        return obj.name.startsWith('Object') && (obj.age > 60 && obj.age < 85);
    };
    let opts = {
        'orderBy': 'age',
        'sortDirection': 'desc'
    };

    let match = PersistentObject.first(db, fn, opts);
    expect(match).not.toBeNull();
    expect(match.age).toEqual(80);

    // Same query, different sort
    opts.sortDirection = 'asc';
    match = PersistentObject.first(db, fn, opts);
    expect(match).not.toBeNull();
    expect(match.age).toEqual(65);

    // Change offset, still sorting asc.
    // The query should ignore the limit, since
    // first should return no more than one item.
    opts.offset = 2;
    opts.limit = 2;
    match = PersistentObject.first(db, fn, opts);
    expect(match).not.toBeNull();
    expect(match.age).toEqual(75);

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
            if (f.startsWith('test') && f.endsWith('.json')) {
                let jsonFile = path.join(Context.config.dataDir, f);
                fs.unlinkSync(jsonFile);
            }
        }
    }
}
