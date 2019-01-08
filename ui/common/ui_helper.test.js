const { UIHelper } = require('./ui_helper');

test('parseLocation', () => {
    let data = UIHelper.parseLocation('#Controller/fnName?name=Bart&name=Lisa&sort=age&page=1');
    expect(data.controller).toMatch('Controller');
    expect(data.fn).toMatch('fnName');
    expect(data.params.getAll('name')).toEqual(['Bart', 'Lisa']);
    expect(data.params.get('sort')).toEqual('age');
    expect(data.params.get('page')).toEqual('1');

    expect(() => { UIHelper.parseLocation('xyz?whatever=true') }).toThrow(
        "Invalid URL: 'xyz?whatever=true' is missing controller or function name.");
});
