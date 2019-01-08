const { AppSettingController } = require('../controllers/app_setting');
const { UIHelper } = require('./ui_helper');
const url = require('url');
jest.mock('../controllers/app_setting');

beforeEach(() => {
  AppSettingController.mockClear();
});

test('parseLocation', () => {
    // Hash without query string
    let data = UIHelper.parseLocation('index.html#Controller/fnName');
    expect(data.controller).toMatch('Controller');
    expect(data.fn).toMatch('fnName');

    // Hash with query string
    data = UIHelper.parseLocation('index.html#Controller/fnName?name=Bart&name=Lisa&sort=age&page=1');
    expect(data.controller).toMatch('Controller');
    expect(data.fn).toMatch('fnName');
    expect(data.params.getAll('name')).toEqual(['Bart', 'Lisa']);
    expect(data.params.get('sort')).toEqual('age');
    expect(data.params.get('page')).toEqual('1');

    // Bad values
    expect(() => { UIHelper.parseLocation('xyz?whatever=true') }).toThrow(
        "Invalid URL: 'xyz?whatever=true' is missing hash.");

    expect(() => { UIHelper.parseLocation('#i_need_a_slash') }).toThrow(
        "Invalid URL: '#i_need_a_slash' is missing controller or function name.");

});

test('handleRequest', () => {
    let params = new url.URLSearchParams([
        ['name', 'Bart'],
        ['name', 'Lisa'],
        ['sort', 'age'],
        ['page', '1']
    ]);
    expect(AppSettingController).not.toHaveBeenCalled();
    UIHelper.handleRequest('index.html#AppSetting/list?name=Bart&name=Lisa&sort=age&page=1');
    expect(AppSettingController).toHaveBeenCalledTimes(1);
    expect(AppSettingController).toHaveBeenCalledWith(params);
    expect(AppSettingController.mock.instances[0].list).toHaveBeenCalledTimes(1);
})
