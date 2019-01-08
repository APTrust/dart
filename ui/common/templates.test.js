const Templates = require('./templates');

test('renderNav', () => {
    expect(Templates.nav({ section: 'Dashboard' })).toMatch(activeNavPattern('#Dashboard/show'));
    expect(Templates.nav({ section: 'Settings' })).toMatch(activeNavPattern('Settings'));
    expect(Templates.nav({ section: 'Jobs' })).toMatch(activeNavPattern('Jobs'));
    expect(Templates.nav({ section: 'Help' })).toMatch(activeNavPattern('Help'));
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
