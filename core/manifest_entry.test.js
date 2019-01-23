const fs = require('fs');
const path = require('path');
const { Context } = require('./context');
const { ManifestEntry } = require('./manifest_entry');
const { TestUtil } = require('./test_util');
const { Util } = require('./util');

beforeEach(() => {
    TestUtil.deleteJsonFile('ManifestEntry');
});

afterAll(() => {
    TestUtil.deleteJsonFile('ManifestEntry');
});

test('Constructor sets expected properties', () => {
    let list = makeObjects(1);
    let obj = list[0];
    expect(obj.type).toEqual('ManifestEntry');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(Util.looksLikeUUID(obj.jobId)).toEqual(true);
    expect(obj.origPath.startsWith('/path/to')).toEqual(true);
    expect(obj.pathInBag.startsWith('data/')).toEqual(true);
    expect(obj.algorithm).toEqual('sha256');
    expect(obj.digest.length).toBeGreaterThan(0);
    expect(obj.timestamp.length).toBeGreaterThan(0);
    expect(obj.userCanDelete).toEqual(true);
});

test('validate()', () => {
    let obj = new ManifestEntry();
    let result1 = obj.validate();
    expect(result1).toEqual(false);
    expect(obj.errors['jobId']).toEqual('jobId cannot be empty.');
    expect(obj.errors['origPath']).toEqual('origPath cannot be empty.');
    expect(obj.errors['pathInBag']).toEqual('pathInBag cannot be empty.');
    expect(obj.errors['algorithm']).toEqual('algorithm cannot be empty.');
    expect(obj.errors['digest']).toEqual('digest cannot be empty.');

    let obj2 = makeObjects(1)[0];
    let result2 = obj2.validate();
    expect(result2).toEqual(true);
});

test('find()', () => {
    let objs = makeObjects(3);
    let obj = objs[1];
    expect(ManifestEntry.find(obj.id)).toEqual(obj);
});

test('sort()', () => {
    let objs = makeObjects(3);
    let sortedAsc = ManifestEntry.sort("origPath", "asc");
    expect(sortedAsc[0].origPath.endsWith('1.pdf')).toEqual(true);
    expect(sortedAsc[2].origPath.endsWith('3.pdf')).toEqual(true);
    let sortedDesc = ManifestEntry.sort("origPath", "desc");
    expect(sortedDesc[0].origPath.endsWith('3.pdf')).toEqual(true);
    expect(sortedDesc[2].origPath.endsWith('1.pdf')).toEqual(true);
});

test('findMatching()', () => {
    let objs = makeObjects(3);
    let matches = ManifestEntry.findMatching("pathInBag", "data/3.pdf");
    expect(matches.length).toEqual(1);
    expect(matches[0].pathInBag).toEqual("data/3.pdf");
});

test('firstMatching()', () => {
    let objs = makeObjects(3);
    let match = ManifestEntry.firstMatching("pathInBag", "data/3.pdf");
    expect(match).not.toBeNull();
    expect(match.pathInBag).toEqual("data/3.pdf");
});

test('list()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.pathInBag != null;
    }
    let opts = {
        limit: 2,
        offset: 1,
        orderBy: "pathInBag",
        sortDirection: "asc"
    }
    let matches = ManifestEntry.list(fn, opts);
    expect(matches.length).toEqual(2);
    expect(matches[0].pathInBag).toEqual("data/2.pdf");
    expect(matches[1].pathInBag).toEqual("data/3.pdf");
});

test('first()', () => {
    let objs = makeObjects(3);
    let fn = function(obj) {
        return obj.pathInBag != null;
    }
    let opts = {
        orderBy: "pathInBag",
        sortDirection: "desc"
    }
    let match = ManifestEntry.first(fn, opts);
    expect(match).not.toBeNull();
    expect(match.pathInBag).toEqual("data/3.pdf");
});

function makeObjects(howMany) {
    let list = [];
    for(let i=0; i < howMany; i++) {
        let jobId = Util.uuid4();
        let origPath = `/path/to/file/${i + 1}.pdf`;
        let pathInBag = `data/${i + 1}.pdf`;
        let algorithm = 'sha256';
        let digest = Math.random().toString();
        let obj = new ManifestEntry({
            jobId: jobId,
            origPath: origPath,
            pathInBag: pathInBag,
            algorithm: algorithm,
            digest: digest
        });
        obj.save();
        list.push(obj);
    }
    return list;
}
