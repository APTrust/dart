const es = require('../core/easy_store')

module.exports = class Menu {

    static setupShow() {
        var data = {};
        var setupList = new es.Field('setupProvider', 'setupProvider', 'Repository', '');
        setupList.choices = es.Choice.makeList(es.Plugins.listSetupProviders(), '', true);
        data.setupList = setupList;
        $("#container").html(es.Templates.setup(data));
        es.ActiveObject = null;
    }

}
