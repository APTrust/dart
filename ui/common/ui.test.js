const { UI } = require('./ui');

test('Constructor compiles templates', () => {
    expect(UI.templates.nav).toBeDefined();

});

test('renderNav', () => {
    expect(UI.renderNav('Dashboard')).toMatch(activeNavPattern('#Dashboard/show'));
    expect(UI.renderNav('Settings')).toMatch(activeNavPattern('Settings'));
    expect(UI.renderNav('Jobs')).toMatch(activeNavPattern('Jobs'));
    expect(UI.renderNav('Help')).toMatch(activeNavPattern('Help'));
});

test('parseLocation', () => {
    let data = UI.parseLocation('#Controller/fnName?name=Bart&name=Lisa&sort=age&page=1');
    expect(data.controller).toMatch('Controller');
    expect(data.fn).toMatch('fnName');
    expect(data.params.getAll('name')).toEqual(['Bart', 'Lisa']);
    expect(data.params.get('sort')).toEqual('age');
    expect(data.params.get('page')).toEqual('1');

    expect(() => { UI.parseLocation('xyz?whatever=true') }).toThrow(
        "Invalid URL: 'xyz?whatever=true' is missing controller or function name.");
});


function activeNavPattern(which) {
    let pattern;
    if (which.includes('Dashboard')) {
        let escaped = which.replace('/', '\/');
        pattern = `<li class="nav-item active">\\s+<a class="nav-link" href="${escaped}">`;
    } else {
        pattern = `<li class="nav-item dropdown active">\\s+<a class="nav-link dropdown-toggle" href="#" id="\\w+" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${which}</a>`;
    }
    return new RegExp(pattern);
}
