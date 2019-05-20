const { StorageService } = require('../../core/storage_service');
const { StorageServiceForm } = require('./storage_service_form');

test('create()', () => {
    let ss = new StorageService({ name: 'APTrust Demo' });
    ss.description = 'APTrust demo ingest bucket';
    ss.protocol = 's3';
    ss.host = 'https://s3.example.com';
    ss.port = 434;
    ss.bucket = 'the.chum.bucket';
    ss.allowsUpload = true;
    ss.allowsDownload = false;
    ss.login = 'plankton';
    ss.password = 'krabs';
    ss.loginExtra = 'patrick';
    let form = new StorageServiceForm(ss);

    // Fields for all properties listed above, plus id & userCanDelete.
    expect(Object.keys(form.fields).length).toEqual(13);

    let props = ['id', 'name', 'description', 'protocol', 'host', 'port',
                 'bucket', 'allowsUpload', 'allowsDownload', 'login',
                 'password', 'loginExtra', 'userCanDelete'];
    for (let propName of props) {
        expect(form.fields[propName]).toBeDefined();
        expect(form.fields[propName].name).toEqual(propName);
        expect(form.fields[propName].value).toEqual(ss[propName]);
    }

    let choices = form.fields.protocol.choices;
    expect(choices.length).toBeGreaterThan(1);
    for (let choice of choices) {
        expect(choice.value).toBeDefined();
        expect(choice.label).toBeDefined();
        if (choice.value === ss.protocol) {
            expect(choice.selected).toBe(true);
        } else {
            expect(choice.selected).toBe(false);
        }
    }
});
