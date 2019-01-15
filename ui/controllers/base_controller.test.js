const { BaseController } = require('./base_controller');
const url = require('url');

const params = new url.URLSearchParams({
    limit: '10',
    offset: '0',
    orderBy: 'name',
    sortDirection: 'desc',
    boolValue: 'true',
    url: 'https://example.com'
});


test('Constructor sets expected properties', () => {
    let controller = new BaseController(params, "Settings");
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Settings");
    expect(controller.typeMap).toEqual({});
    expect(controller.alertMessage).toBeNull();
});

test('paramsToHash() with typeMap entries', () => {
    let controller = new BaseController(params, "Settings");
    controller.typeMap = {
        limit: 'number',
        offset: 'number',
        orderBy: 'string',
        sortDirection: 'string',
        boolValue: 'boolean'
    };
    let data = controller.paramsToHash();
    expect(data.limit).toBe(10);
    expect(data.offset).toBe(0);
    expect(data.orderBy).toBe('name');
    expect(data.sortDirection).toBe('desc');
    expect(data.boolValue).toBe(true);
    expect(data.url).toBe('https://example.com');
});

test('paramsToHash() without typeMap entries', () => {
    let controller = new BaseController(params, "Settings");
    let data = controller.paramsToHash();

    // All items remain strings
    expect(data.limit).toBe('10');
    expect(data.offset).toBe('0');
    expect(data.orderBy).toBe('name');
    expect(data.sortDirection).toBe('desc');
    expect(data.boolValue).toBe('true');
    expect(data.url).toBe('https://example.com');
});

test('containerContent()', () => {
    let controller = new BaseController(params, "Settings");
    let data = controller.containerContent('Homer');
    expect(data.nav.length).toBeGreaterThan(0);
    expect(data.container).toEqual('Homer');
});

test('modalContent()', () => {
    let controller = new BaseController(params, "Settings");
    let data = controller.modalContent('-title-', '-body-');
    expect(data.modalTitle).toEqual('-title-');
    expect(data.modalContent).toEqual('-body-');
});

test('noContent()', () => {
    let controller = new BaseController(params, "Settings");
    expect(controller.noContent()).toEqual({});
});
