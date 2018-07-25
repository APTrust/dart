const fs = require('fs');
const os = require('os');
const path = require('path');
const { PersistentObject } = require('./persistent_object');

test('PersistentObject creates data store file and returns object', () => {
    var tmpDir = os.tmpdir();
    var fileName = 'po_unit_test';
    var dataFile = path.join(tmpDir, fileName + '.json')
    fs.unlinkSync(dataFile)
    var po = new PersistentObject(tmpDir, fileName)
    expect(po).not.toBeNull();
    expect(fs.existsSync(dataFile)).toBe(true);
});
