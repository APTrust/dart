const { TagDefinition } = require('./tag_definition');
const { Util } = require('../core/util');

test('Constructor sets initial properties', () => {
    let obj = new TagDefinition('bag-info.txt', 'Source-Organization');
    expect(Util.looksLikeUUID(obj.id)).toEqual(true);
    expect(obj.tagFile).toEqual('bag-info.txt');
    expect(obj.tagName).toEqual('Source-Organization');
    expect(obj.required).toEqual(false);
    expect(obj.emptyOk).toEqual(false);
    expect(obj.values).toEqual([]);
    expect(obj.userValue).toEqual('');
    expect(obj.help).toEqual('');
    expect(obj.isBuiltIn).toEqual(false);
    expect(obj.addedForJob).toEqual(false);
});
