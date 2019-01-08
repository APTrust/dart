const { Choice } = require('./choice');

test('Constructor sets expected properies', () => {
    let choice = new Choice('12', 'Twelve');
    expect(choice.value).toEqual('12');
    expect(choice.label).toEqual('Twelve');
    expect(choice.selected).toEqual(false);

    choice = new Choice('12', 'Twelve', true);
    expect(choice.value).toEqual('12');
    expect(choice.label).toEqual('Twelve');
    expect(choice.selected).toEqual(true);
});

test('makeList', () => {
    let items = [
        { name: 'First', id: '1' },
        { name: 'Second', id: '2' },
        { name: 'Third', id: '3' }
    ];
    let selected = ['2', '3'];
    let list = Choice.makeList(items, selected, true);
    expect(list.length).toEqual(4);

    expect(list[0].label).toEqual('');
    expect(list[0].value).toEqual('');
    expect(list[0].selected).toEqual(false);

    expect(list[1].label).toEqual('First');
    expect(list[1].value).toEqual('1');
    expect(list[1].selected).toEqual(false);

    expect(list[2].label).toEqual('Second');
    expect(list[2].value).toEqual('2');
    expect(list[2].selected).toEqual(true);

    expect(list[3].label).toEqual('Third');
    expect(list[3].value).toEqual('3');
    expect(list[3].selected).toEqual(true);
});
