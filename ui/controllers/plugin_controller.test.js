const { PluginController } = require('./plugin_controller');
const { PluginManager } = require('../../plugins/plugin_manager');
const url = require('url');

const params = new url.URLSearchParams();


test('Constructor sets expected properties', () => {
    let controller = new PluginController(params);
    expect(controller.params).toEqual(params);
    expect(controller.navSection).toEqual("Help");
});

test('list()', () => {
    let controller = new PluginController(params);
    let response = controller.list();
    for (let pluginType of PluginManager.types()) {
        for (let module of PluginManager.getModuleCollection(pluginType)) {
            let desc = module.description();
            expect(response.container).toMatch(desc.name);
            expect(response.container).toMatch(desc.description);
        }
    }
});
