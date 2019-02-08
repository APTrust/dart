const { TagDefinition } = require('../../bagit/tag_definition');
const { TagDefinitionForm } = require('./tag_definition_form');

test('create()', () => {
    let tagDefinition = new TagDefinition({
        tagFile: 'custom-info.txt',
        tagName: 'Sender-Name',
        values: ['Homer', 'Marge', 'Ned'],
        defaultValue: 'Homer',
        help: 'Who sent this?'
    });
    let expectedFields = [
        'id', 'tagFile', 'tagName', 'required', 'emptyOk',
        'values', 'defaultValue', 'userValue', 'isBuiltIn',
        'isUserAddedFile', 'isUserAddedTag', 'help'
    ];
    let form = new TagDefinitionForm(tagDefinition);
    expect(Object.keys(form.fields).length).toEqual(expectedFields.length);
    for (let fieldName of expectedFields) {
        expect(form.fields[fieldName]).toBeDefined();
    }
});
