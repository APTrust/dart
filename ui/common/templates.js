const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars')
const templateDir = path.join(__dirname, "..", "templates");

function readFile(...args) {
    let filepath = path.join(templateDir, ...args)
    return fs.readFileSync(filepath, 'utf8');
}

var about = handlebars.compile(readFile('about', 'index.html'));
var appSettingForm = handlebars.compile(readFile('app_setting', 'form.html'));
var appSettingList = handlebars.compile(readFile('app_setting', 'list.html'));
// var bagItProfileList = handlebars.compile(readFile('bagit_profile_list.html'));
// var bagItProfileForm = handlebars.compile(readFile('bagit_profile_form.html'));
// var bagItProfileNew = handlebars.compile(readFile('bagit_profile_new.html'));
// var dashboard = handlebars.compile(readFile('dashboard.html'));
// var help = handlebars.compile(readFile('help.html'));
// var jobFiles = handlebars.compile(readFile('job_files.html'));
// var jobList = handlebars.compile(readFile('job_list.html'));
// var jobPackaging = handlebars.compile(readFile('job_packaging.html'));
// var jobReview = handlebars.compile(readFile('job_review.html'));
// var jobStorage = handlebars.compile(readFile('job_storage.html'));
// var jobSummaryPanel = handlebars.compile(readFile('job_summary_panel.html'));
// var jobTags = handlebars.compile(readFile('job_tags.html'));
// var log = handlebars.compile(readFile('log.html'));
// var manifest = handlebars.compile(readFile('manifest.html'));
var nav = handlebars.compile(readFile('nav.html'));
// var newTagFileForm = handlebars.compile(readFile('tag_file_new.html'));
// var setup = handlebars.compile(readFile('setup.html'));
// var setupQuestion = handlebars.compile(readFile('setup_question.html'));
// var storageServiceForm = handlebars.compile(readFile('storage_service_form.html'));
// var storageServiceList = handlebars.compile(readFile('storage_service_list.html'));
// var tagDefinitionForm = handlebars.compile(readFile('tag_definition_form.html'));
// var uploadOrRebag = handlebars.compile(readFile('upload_or_rebag.html'));

handlebars.registerPartial({
    customTag: readFile(path.join('partials', 'custom_tag.html')),
    inputCheckboxGroup: readFile(path.join('partials', 'input_checkbox_group.html')),
    inputHidden: readFile(path.join('partials', 'input_hidden.html')),
    inputPassword: readFile(path.join('partials', 'input_password.html')),
    inputSelect: readFile(path.join('partials', 'input_select.html')),
    inputText: readFile(path.join('partials', 'input_text.html')),
    inputTextArea: readFile(path.join('partials', 'input_textarea.html')),
    jobTabs: readFile(path.join('partials', 'job_tabs.html')),
    profileTags: readFile(path.join('partials', 'profile_tags.html')),
    tableBottomLinks: readFile(path.join('partials', 'table_bottom_links.html'))
});

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('jobFormTagField', function(tag) {
    return tag.toFieldForJobForm();
});

handlebars.registerHelper('resultSummary', function(result) {
    return result.summary();
});

// Return a random number to force hash change.
// __rand={{ rand }}
handlebars.registerHelper('rand', function() {
  return Math.random();
});

module.exports.about = about;
module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
// module.exports.bagItProfileForm = bagItProfileForm;
// module.exports.bagItProfileList = bagItProfileList;
// module.exports.bagItProfileNew = bagItProfileNew;
// module.exports.dashboard = dashboard;
// module.exports.help = help;
// module.exports.jobFiles = jobFiles;
// module.exports.jobList = jobList;
// module.exports.jobPackaging = jobPackaging;
// module.exports.jobReview = jobReview;
// module.exports.jobSummaryPanel = jobSummaryPanel;
// module.exports.jobStorage = jobStorage;
// module.exports.jobTags = jobTags;
// module.exports.log = log;
// module.exports.manifest = manifest;
module.exports.nav = nav;
// module.exports.newTagFileForm = newTagFileForm;
// module.exports.setup = setup;
// module.exports.setupQuestion = setupQuestion;
// module.exports.storageServiceForm = storageServiceForm;
// module.exports.storageServiceList = storageServiceList;
// module.exports.tagDefinitionForm = tagDefinitionForm;
// module.exports.uploadOrRebag = uploadOrRebag;
