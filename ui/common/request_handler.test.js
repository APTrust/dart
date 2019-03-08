const { AppSettingController } = require('../controllers/app_setting_controller');
const { RequestHandler } = require('./request_handler');
const url = require('url');

// Set up a mock AppSettingController
jest.mock('../controllers/app_setting_controller');
AppSettingController.prototype.list = jest.fn().mockReturnValue({nav:'', container:''});

beforeEach(() => {
  AppSettingController.mockClear();
});

test('constructor', () => {
    // Hash without query string
    let handler = new RequestHandler('index.html#AppSetting/list');
    expect(handler.controllerName).toEqual('AppSettingController');
    expect(handler.functionName).toEqual('list');

    // Hash with query string
    handler = new RequestHandler('index.html#AppSetting/list?name=Bart&name=Lisa&sort=age&page=1');
    expect(handler.controllerName).toEqual('AppSettingController');
    expect(handler.functionName).toEqual('list');
    expect(handler.params.getAll('name')).toEqual(['Bart', 'Lisa']);
    expect(handler.params.get('sort')).toEqual('age');
    expect(handler.params.get('page')).toEqual('1');

    // Bad values
    expect(() => { new RequestHandler('xyz?whatever=true') }).toThrow(
        "Invalid URL: 'xyz?whatever=true' is missing hash.");

    expect(() => { new RequestHandler('#i_need_a_slash') }).toThrow(
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

    let handler = new RequestHandler('index.html#AppSetting/list?name=Bart&name=Lisa&sort=age&page=1');
    handler.handleRequest();
    expect(AppSettingController).toHaveBeenCalledTimes(1);
    expect(AppSettingController).toHaveBeenCalledWith(params);
    expect(AppSettingController.mock.instances[0].list).toHaveBeenCalledTimes(1);
});

// test('handleRequest', () => {
//     let loc = '#Job/new';
//     let handler = new RequestHandler(loc);
//     expect(handler.controllerName).toEqual('JobController');
//     expect(handler.functionName).toEqual('new');
//     expect(typeof handler.postRenderCallback).toEqual('function');
// });
