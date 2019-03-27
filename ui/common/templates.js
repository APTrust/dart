const { Context } = require('../../core/context');
const dateFormat = require('dateformat');
const fs = require('fs');
const handlebars = require('handlebars')
const path = require('path');
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
// var dashboard = handlebars.compile(readFile('dashboard.html'));
// var help = handlebars.compile(readFile('help.html'));
var internalSettingList = handlebars.compile(readFile('internal_setting', 'list.html'));
var jobFileRow = handlebars.compile(readFile('job', 'file_row.html'));
var jobFiles = handlebars.compile(readFile('job', 'files.html'));
var jobForm = handlebars.compile(readFile('job', 'form.html'));
var jobList = handlebars.compile(readFile('job', 'list.html'));
var jobPackaging = handlebars.compile(readFile('job', 'packaging.html'));
var jobMetadata = handlebars.compile(readFile('job', 'metadata.html'));
var jobUpload = handlebars.compile(readFile('job', 'upload.html'));
var jobRun = handlebars.compile(readFile('job', 'run.html'));
// var log = handlebars.compile(readFile('log.html'));
// var manifest = handlebars.compile(readFile('manifest.html'));
var nav = handlebars.compile(readFile('nav.html'));
var remoteRepositoryForm = handlebars.compile(readFile('remote_repository', 'form.html'));
var remoteRepositoryList = handlebars.compile(readFile('remote_repository', 'list.html'));
// var newTagFileForm = handlebars.compile(readFile('tag_file_new.html'));
// var setup = handlebars.compile(readFile('setup.html'));
// var setupQuestion = handlebars.compile(readFile('setup_question.html'));
var tagDefinitionForm = handlebars.compile(readFile('tag_definition', 'form.html'));
var tagFileForm = handlebars.compile(readFile('tag_file', 'form.html'));
var uploadTargetForm = handlebars.compile(readFile('upload_target', 'form.html'));
var uploadTargetList = handlebars.compile(readFile('upload_target', 'list.html'));
// var uploadOrRebag = handlebars.compile(readFile('upload_or_rebag.html'));

handlebars.registerPartial({
    bannerAlert: readFile(path.join('partials', 'banner_alert.html')),
    customTag: readFile(path.join('partials', 'custom_tag.html')),
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

module.exports.about = about;
module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
module.exports.bagItProfileForm = bagItProfileForm;
module.exports.bagItProfileList = bagItProfileList;
module.exports.bagItProfileNew = bagItProfileNew;
// module.exports.dashboard = dashboard;
// module.exports.help = help;
module.exports.internalSettingList = internalSettingList;
module.exports.jobFileRow = jobFileRow;
module.exports.jobFiles = jobFiles;
module.exports.jobForm = jobForm;
module.exports.jobList = jobList;
module.exports.jobPackaging = jobPackaging;
module.exports.jobMetadata = jobMetadata;
module.exports.jobUpload = jobUpload;
module.exports.jobRun = jobRun;
// module.exports.log = log;
// module.exports.manifest = manifest;
module.exports.nav = nav;
module.exports.partials = handlebars.partials;
module.exports.remoteRepositoryForm = remoteRepositoryForm;
module.exports.remoteRepositoryList = remoteRepositoryList;
// module.exports.newTagFileForm = newTagFileForm;
// module.exports.setup = setup;
// module.exports.setupQuestion = setupQuestion;
module.exports.tagDefinitionForm = tagDefinitionForm;
module.exports.tagFileForm = tagFileForm;
module.exports.uploadTargetForm = uploadTargetForm;
module.exports.uploadTargetList = uploadTargetList;
// module.exports.uploadOrRebag = uploadOrRebag;
