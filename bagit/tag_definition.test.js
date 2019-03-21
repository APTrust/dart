const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');

test('Constructor sets initial properties', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    expect(Util.looksLikeUUID(tagDef.id)).toEqual(true);
    expect(tagDef.tagFile).toEqual('bag-info.txt');
    expect(tagDef.tagName).toEqual('Source-Organization');
    expect(tagDef.required).toEqual(false);
    expect(tagDef.emptyOk).toEqual(false);
    expect(tagDef.values).toEqual([]);
    expect(tagDef.userValue).toEqual('');
    expect(tagDef.help).toEqual('');
    expect(tagDef.isBuiltIn).toEqual(false);
    expect(tagDef.isUserAddedFile).toEqual(false);
    expect(tagDef.isUserAddedTag).toEqual(false);
});

test('validate()', () => {
    var tagDef = new TagDefinition();
    var result = tagDef.validate();
    expect(result).toEqual(false);
    expect(Object.keys(tagDef.errors).length).toEqual(2);
    expect(tagDef.errors['tagFile']).toEqual('You must specify a tag file.');
    expect(tagDef.errors['tagName']).toEqual('You must specify a tag name.');

    tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    result = tagDef.validate();
    expect(result).toEqual(true);

    tagDef.values = ['honest', 'respectable', 'responsible'];
    tagDef.defaultValue = 'not one of the allowed options';
    result = tagDef.validate();
    expect(result).toEqual(false);
    expect(Object.keys(tagDef.errors).length).toEqual(1);
    expect(tagDef.errors['defaultValue']).toEqual('The default value must be one of the allowed values.');

    tagDef.defaultValue = 'drump';
    result = tagDef.validate();
    expect(result).toEqual(false);
    expect(Object.keys(tagDef.errors).length).toEqual(1);
    expect(tagDef.errors['defaultValue']).toEqual('The default value must be one of the allowed values.');

    tagDef.defaultValue = 'honest';
    result = tagDef.validate();
    expect(result).toEqual(true);
});

test('validateForJob() permits legal empty tag value', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.required = false;
    tagDef.emptyOk = true;
    let errors = tagDef.validateForJob();
    expect(errors.length).toEqual(0);
});


test('validateForJob() catches illegal empty tag values', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.values = ['honest', 'respectable', 'responsible'];
    let errors = tagDef.validateForJob();
    expect(errors.length).toEqual(1);
    expect(errors[0]).toEqual('Tag Source-Organization in file bag-info.txt has a value that is not on the list of allowed values.');
});

test('validateForJob() catches illegal non-empty tag values', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
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
        let tagDef = new TagDefinition({
            tagFile: 'custom.txt',
            tagName: tagName
        });
        expect(tagDef.systemMustSet(tagName)).toEqual(true);
    }
    for (let tagName of no) {
        let tagDef = new TagDefinition({
            tagFile: 'custom.txt',
            tagName: tagName
        });
        expect(tagDef.systemMustSet(tagName)).toEqual(false);
    }
});

test('getValue() returns defaultValue when no userValue is present', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.defaultValue = 'xyz';
    expect(tagDef.getValue()).toEqual('xyz');
});

test('getValue() returns userValue when present', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.defaultValue = 'xyz';
    tagDef.userValue = 'abc';
    expect(tagDef.getValue()).toEqual('abc');
});

test('looksLikeDescriptionTag() returns true if tag name includes description', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Internal-Sender-Description'
    });
    expect(tagDef.looksLikeDescriptionTag()).toEqual(true);
});

test('looksLikeDescriptionTag() returns false if tag name does not include description', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Duhskripshin'
    });
    expect(tagDef.looksLikeDescriptionTag()).toEqual(false);
});

test('toFormattedString() returns correct format and value', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.defaultValue = 'School of Hard Knocks';
    expect(tagDef.toFormattedString()).toEqual('Source-Organization: School of Hard Knocks');

    tagDef.userValue = 'Faber College';
    expect(tagDef.toFormattedString()).toEqual('Source-Organization: Faber College');
});

test('toFormattedString() replaces returns and trims leading and trailing spaces', () => {
    let tagDef = new TagDefinition({
        tagFile: 'bag-info.txt',
        tagName: 'Source-Organization'
    });
    tagDef.userValue = '  Faber \r\n   College \n  ';
    expect(tagDef.toFormattedString()).toEqual('Source-Organization: Faber College');
});

test('fromCommandLineArg() returns tag with correct values', () => {
    // Without .txt
    let tagDef = TagDefinition.fromCommandLineArg('bag-info/Source-Organization: Faber College');
    expect(tagDef).toBeDefined();
    expect(tagDef.tagFile).toEqual('bag-info.txt');
    expect(tagDef.tagName).toEqual('Source-Organization');
    expect(tagDef.userValue).toEqual('Faber College');

    // With .txt
    tagDef = TagDefinition.fromCommandLineArg('bag-info.txt/Source-Organization: Faber College');
    expect(tagDef).toBeDefined();
    expect(tagDef.tagFile).toEqual('bag-info.txt');
    expect(tagDef.tagName).toEqual('Source-Organization');
    expect(tagDef.userValue).toEqual('Faber College');

    // Throw on bad input format. Colon and slash are in the wrong places.
    expect(() => {
        TagDefinition.fromCommandLineArg('bag-info.txt:Source-Organization/ Faber College');
    }).toThrow();
});
