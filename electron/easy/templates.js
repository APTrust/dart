const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars')
const templateDir = path.join(__dirname, "..", "templates");

function pathTo(name) {
    return path.join(templateDir, name)
}

var _appSettingsList = fs.readFileSync(pathTo('app_settings_list.html'), 'utf8');
var appSettingsList = handlebars.compile(_appSettingsList);

module.exports.appSettingsList = appSettingsList;
