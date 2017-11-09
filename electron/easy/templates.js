const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars')
const templateDir = path.join(__dirname, "..", "templates");

function pathTo(name) {
    return path.join(templateDir, name)
}
function readFile(filename) {
    return fs.readFileSync(pathTo(filename), 'utf8');
}

var appSettingsList = handlebars.compile(readFile(('app_settings_list.html')));

module.exports.appSettingsList = appSettingsList;
