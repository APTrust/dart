const { Context } = require('../../core/context');
const dateFormat = require('dateformat');
const fs = require('fs');
const handlebars = require('handlebars')
const path = require('path');
const { Util } = require('../../core/util');

const templateDir = path.join(__dirname, "..", "templates");

function readFile(...args) {
    let filepath = path.join(templateDir, ...args)
    return fs.readFileSync(filepath, 'utf8');
}

var about = handlebars.compile(readFile('about', 'index.html'));
var appSettingForm = handlebars.compile(readFile('app_setting', 'form.html'));
var appSettingList = handlebars.compile(readFile('app_setting', 'list.html'));
var bagItProfileList = handlebars.compile(readFile('bagit_profile', 'list.html'));
var bagItProfileForm = handlebars.compile(readFile('bagit_profile', 'form.html'));
var bagItProfileNew = handlebars.compile(readFile('bagit_profile', 'new.html'));
var dartProcessList = handlebars.compile(readFile('dart_process', 'list.html'));
// var dashboard = handlebars.compile(readFile('dashboard.html'));
// var help = handlebars.compile(readFile('help.html'));
var internalSettingList = handlebars.compile(readFile('internal_setting', 'list.html'));
var jobFileRow = handlebars.compile(readFile('job', 'file_row.html'));
var jobFiles = handlebars.compile(readFile('job', 'files.html'));
var jobForm = handlebars.compile(readFile('job', 'form.html'));
var jobList = handlebars.compile(readFile('job', 'list.html'));
var jobPackaging = handlebars.compile(readFile('job', 'packaging.html'));
var jobMetadata = handlebars.compile(readFile('job', 'metadata.html'));
var jobNewTag = handlebars.compile(readFile('job', 'new_tag.html'));
var jobUpload = handlebars.compile(readFile('job', 'upload.html'));
var jobRun = handlebars.compile(readFile('job', 'run.html'));
// var manifest = handlebars.compile(readFile('manifest.html'));
var nav = handlebars.compile(readFile('nav.html'));
var remoteRepositoryForm = handlebars.compile(readFile('remote_repository', 'form.html'));
var remoteRepositoryList = handlebars.compile(readFile('remote_repository', 'list.html'));
var storageServiceForm = handlebars.compile(readFile('storage_service', 'form.html'));
var storageServiceList = handlebars.compile(readFile('storage_service', 'list.html'));
// var newTagFileForm = handlebars.compile(readFile('tag_file_new.html'));
var setupList = handlebars.compile(readFile('setup', 'list.html'));
// var setupQuestion = handlebars.compile(readFile('setup_question.html'));
var tagDefinitionForm = handlebars.compile(readFile('tag_definition', 'form.html'));
var tagFileForm = handlebars.compile(readFile('tag_file', 'form.html'));
// var uploadOrRebag = handlebars.compile(readFile('upload_or_rebag.html'));

handlebars.registerPartial({
    bannerAlert: readFile(path.join('partials', 'banner_alert.html')),
    customTag: readFile(path.join('partials', 'custom_tag.html')),
    dartProcess: readFile(path.join('partials', 'dart_process.html')),
    formButtons: readFile(path.join('partials', 'form_buttons.html')),
    inputCheckboxGroup: readFile(path.join('partials', 'input_checkbox_group.html')),
    inputHidden: readFile(path.join('partials', 'input_hidden.html')),
    inputPassword: readFile(path.join('partials', 'input_password.html')),
    inputSelect: readFile(path.join('partials', 'input_select.html')),
    inputText: readFile(path.join('partials', 'input_text.html')),
    inputTextArea: readFile(path.join('partials', 'input_textarea.html')),
    jobTabs: readFile(path.join('partials', 'job_tabs.html')),
    profileTags: readFile(path.join('partials', 'profile_tags.html')),
    tableBottomLinks: readFile(path.join('partials', 'table_bottom_links.html')),
    tagDefRow: readFile(path.join('partials', 'tag_def_row.html'))
});

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('resultSummary', function(result) {
    return result.summary();
});

handlebars.registerHelper('translate', function(message) {
    return Context.y18n.__(message);
});

handlebars.registerHelper('formatDate', function(date, format) {
    return dateFormat(date, format);
});

handlebars.registerHelper('toHumanSize', function(number) {
    return Util.toHumanSize(number);
});

// Pre-compile partials so they can be called from within JS.
for(let [name, template] of Object.entries(handlebars.partials)) {
    handlebars.partials[name] = handlebars.compile(template);
}

module.exports.about = about;
module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
module.exports.bagItProfileForm = bagItProfileForm;
module.exports.bagItProfileList = bagItProfileList;
module.exports.bagItProfileNew = bagItProfileNew;
// module.exports.dashboard = dashboard;
// module.exports.help = help;
module.exports.dartProcessList = dartProcessList;
module.exports.internalSettingList = internalSettingList;
module.exports.jobFileRow = jobFileRow;
module.exports.jobFiles = jobFiles;
module.exports.jobForm = jobForm;
module.exports.jobList = jobList;
module.exports.jobPackaging = jobPackaging;
module.exports.jobMetadata = jobMetadata;
module.exports.jobNewTag = jobNewTag;
module.exports.jobUpload = jobUpload;
module.exports.jobRun = jobRun;
// module.exports.manifest = manifest;
module.exports.nav = nav;
module.exports.partials = handlebars.partials;
module.exports.remoteRepositoryForm = remoteRepositoryForm;
module.exports.remoteRepositoryList = remoteRepositoryList;
module.exports.storageServiceForm = storageServiceForm;
module.exports.storageServiceList = storageServiceList;
// module.exports.newTagFileForm = newTagFileForm;
module.exports.setupList = setupList;
// module.exports.setupQuestion = setupQuestion;
module.exports.tagDefinitionForm = tagDefinitionForm;
module.exports.tagFileForm = tagFileForm;
// module.exports.uploadOrRebag = uploadOrRebag;
