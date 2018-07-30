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
    //expect(po.db).not.toBeNull();
    //expect(po.db.path.includes(path.join('.dart-test', 'data'))).toEqual(true);
});

test('validate() throws error because it must be implemented in derived class', () => {
    let obj = new PersistentObject('test1');
    expect(() => { obj.validate() }).toThrow(Error);
});

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
