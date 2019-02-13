const { TagFileForm } = require('./tag_file_form');

test('create()', () => {

    let form = new TagFileForm('custom-tags.txt');
    expect(Object.keys(form.fields).length).toEqual(2);

    expect(form.fields.id.value).toEqual('throwaway');
    expect(form.fields.tagFileName.value).toEqual('custom-tags.txt');
});
