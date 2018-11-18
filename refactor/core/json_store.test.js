const fs = require('fs');
const os = require('os');
const path = require('path');
const { JsonStore } = require('./json_store');

test('JsonStore creates data store file and returns object', () => {
    var tmpDir = os.tmpdir();
    var fileName = 'json_store_unit_test';
    var dataFile = path.join(tmpDir, fileName + '.json')
    try { fs.unlinkSync(dataFile) }
    catch (ex) { }
    var js = new JsonStore(tmpDir, fileName)
    expect(js).not.toBeNull();
    expect(fs.existsSync(dataFile)).toBe(true);
    try { fs.unlinkSync(dataFile) }
    catch (ex) { }
});
