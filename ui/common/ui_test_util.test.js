const $ = require('jquery');
const { UITestUtil } = require('./ui_test_util');

test('assertActiveNavItem()', () => {
    document.body.innerHTML = `
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link" href="#Dashboard/show">Dashboard</a>
      </li>
      <li class="nav-item active">
        <a class="nav-link" href="#AppSetting/list">Settings</a>
      </li>
    </ul>
    `;
    expect(UITestUtil.getNavItemCssClass('Settings')).toContain('active');
    expect(UITestUtil.getNavItemCssClass('Dashboard')).not.toContain('active');
});

test('setDocumentBody()', () => {
    let response = {
        nav: 'Test Nav',
        container: 'Test Container',
        modalTitle: 'Modal Title',
        modalContent: 'Modal Content'
    };
    UITestUtil.setDocumentBody(response);
    expect($('#nav').text()).toEqual('Test Nav');
    expect($('#container').text()).toEqual('Test Container');
    expect($('#modalTitle').text()).toEqual('Modal Title');
    expect($('#modalContent').text()).toEqual('Modal Content');
});
