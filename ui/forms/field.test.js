const { Choice } = require('./choice');
const { Field } = require('./field');

test('Constructor sets expected properies', () => {
    let field = new Field('id1', 'name1', 'label1', 'value1');
    expect(field.id).toEqual('id1');
    expect(field.name).toEqual('name1');
    expect(field.label).toEqual('label1');
    expect(field.value).toEqual('value1');
    expect(field.error).toEqual('');
    expect(field.choices).toEqual([]);
    expect(field.cssClasses).toEqual([]);
    expect(field.attrs).toEqual({});
    expect(field.validator).toBeNull();
});

test('getSelected()', () => {
    let field = new Field('id1', 'name1', 'label1', 'value1');
    expect(field.getSelected()).toBeNull();

    let items = [
        { name: 'First', id: '1' },
        { name: 'Second', id: '2' },
        { name: 'Third', id: '3' }
    ];
    field.choices = Choice.makeList(items, '2', true);
    expect(field.getSelected()).toEqual('2');

    field.choices = Choice.makeList(items, ['2', '3'], true);
    expect(field.getSelected()).toEqual(['2', '3']);
});
