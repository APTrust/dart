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
