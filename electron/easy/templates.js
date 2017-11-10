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

var appSettingList = handlebars.compile(readFile(('app_setting_list.html')));
var profileList = handlebars.compile(readFile(('bagit_profile_list.html')));
var storageServiceList = handlebars.compile(readFile(('storage_service_list.html')));

var inputPassword = handlebars.compile(readFile(('input_password.html')));

module.exports.appSettingList = appSettingList;
module.exports.inputPassword = inputPassword;
module.exports.profileList = profileList;
module.exports.storageServiceList = storageServiceList;
