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

var appSettingForm = handlebars.compile(readFile(('app_setting_form.html')));
var appSettingList = handlebars.compile(readFile(('app_setting_list.html')));
var profileList = handlebars.compile(readFile(('bagit_profile_list.html')));
var storageServiceList = handlebars.compile(readFile(('storage_service_list.html')));

handlebars.registerPartial({
    inputHidden: readFile('input_hidden.html'),
    inputPassword: readFile('input_password.html'),
    inputSelect: readFile('input_select.html'),
    inputText: readFile('input_text.html'),
    inputTextArea: readFile('input_textarea.html')
});

module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
module.exports.profileList = profileList;
module.exports.storageServiceList = storageServiceList;
