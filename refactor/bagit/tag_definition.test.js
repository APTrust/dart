const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');

test('Constructor sets initial properties', () => {
    let tagDef = new TagDefinition('bag-info.txt', 'Source-Organization');
    expect(Util.looksLikeUUID(tagDef.id)).toEqual(true);
    expect(tagDef.tagFile).toEqual('bag-info.txt');
    expect(tagDef.tagName).toEqual('Source-Organization');
    expect(tagDef.required).toEqual(false);
    expect(tagDef.emptyOk).toEqual(false);
    expect(tagDef.values).toEqual([]);
    expect(tagDef.userValue).toEqual('');
    expect(tagDef.help).toEqual('');
    expect(tagDef.isBuiltIn).toEqual(false);
    expect(tagDef.addedForJob).toEqual(false);
});

test('validate()', () => {
    var tagDef = new TagDefinition('', '');
    var result = tagDef.validate();
    expect(result.isValid()).toEqual(false);
    expect(Object.keys(result.errors).length).toEqual(2);
    expect(result.errors['tagFile']).toEqual('You must specify a tag file.');
    expect(result.errors['tagName']).toEqual('You must specify a tag name.');

    tagDef = new TagDefinition('bag-info.txt', 'Source-Organization');
    result = tagDef.validate();
    expect(result.isValid()).toEqual(true);

    tagDef.values = ['honest', 'respectable', 'responsible'];
    result = tagDef.validate();
    expect(result.isValid()).toEqual(false);
    expect(Object.keys(result.errors).length).toEqual(1);
    expect(result.errors['defaultValue']).toEqual('The default value must be one of the allowed values.');

    tagDef.defaultValue = 'drump';
    result = tagDef.validate();
    expect(result.isValid()).toEqual(false);
    expect(Object.keys(result.errors).length).toEqual(1);
    expect(result.errors['defaultValue']).toEqual('The default value must be one of the allowed values.');

    tagDef.defaultValue = 'honest';
    result = tagDef.validate();
    expect(result.isValid()).toEqual(true);
});

test('validateForJob() permits legal empty tag value', () => {
    let tagDef = new TagDefinition('bag-info.txt', 'Source-Organization');
    tagDef.required = false;
    tagDef.emptyOk = true;
    let errors = tagDef.validateForJob();
    expect(errors.length).toEqual(0);
});


test('validateForJob() catches illegal empty tag values', () => {
    let tagDef = new TagDefinition('bag-info.txt', 'Source-Organization');
    tagDef.values = ['honest', 'respectable', 'responsible'];
    let errors = tagDef.validateForJob();
    expect(errors.length).toEqual(1);
    expect(errors[0]).toEqual('Tag Source-Organization in file bag-info.txt has a value that is not on the list of allowed values.');
});

test('validateForJob() catches illegal non-empty tag values', () => {
    let tagDef = new TagDefinition('bag-info.txt', 'Source-Organization');
    tagDef.required = true;
    tagDef.emptyOk = false;
    tagDef.values = ['honest', 'respectable', 'responsible'];
    tagDef.userValue = 'xyz';
    errors = tagDef.validateForJob();
    expect(errors.length).toEqual(1);
    expect(errors[0]).toEqual('Tag Source-Organization in file bag-info.txt has a value that is not on the list of allowed values.');
});

test('systemMustSet() identifies which tags the system must set', () => {
    let yes = ['Bagging-Date', 'Bagging-Software',
               'Payload-Oxum', 'DPN-Object-ID',
               'First-Version-Object-ID', 'Bag-Size'];
    let no = ['Popeye', 'Olive Oyl'];
    for (let tagName of yes) {
        let tagDef = new TagDefinition('custom.txt', tagName);
        expect(tagDef.systemMustSet(tagName)).toEqual(true);
    }
    for (let tagName of no) {
        let tagDef = new TagDefinition('custom.txt', tagName);
        expect(tagDef.systemMustSet(tagName)).toEqual(false);
    }
});
