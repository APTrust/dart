const { UploadTarget } = require('../../core/upload_target');
const { UploadTargetForm } = require('./upload_target_form');

test('create()', () => {
    let target = new UploadTarget('APTrust Demo');
    target.description = 'APTrust demo ingest bucket';
    target.protocol = 's3';
    target.host = 'https://s3.example.com';
    target.port = 434;
    target.bucket = 'the.chum.bucket';
    target.login = 'plankton';
    target.password = 'krabs';
    target.loginExtra = 'patrick';
    let form = UploadTargetForm.create(target);

    // Fields for all properties listed above, plus id & userCanDelete.
    expect(Object.keys(form.fields).length).toEqual(11);

    let props = ['id', 'name', 'description', 'protocol', 'host', 'port',
                'bucket', 'login', 'password', 'loginExtra', 'userCanDelete'];
    for (let propName of props) {
        expect(form.fields[propName]).toBeDefined();
        expect(form.fields[propName].name).toEqual(propName);
        expect(form.fields[propName].value).toEqual(target[propName]);
    }

    let choices = form.fields.protocol.choices;
    expect(choices.length).toBeGreaterThan(1);
    for (let choice of choices) {
        expect(choice.value).toBeDefined();
        expect(choice.label).toBeDefined();
        expect(choice.selected).toBe(false);
    }
});
