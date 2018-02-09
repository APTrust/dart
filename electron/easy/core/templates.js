const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars')
const templateDir = path.join(__dirname, "..", "..", "templates");

function pathTo(name) {
	return path.join(templateDir, name)
}
function readFile(filename) {
	return fs.readFileSync(pathTo(filename), 'utf8');
}

var appSettingForm = handlebars.compile(readFile('app_setting_form.html'));
var appSettingList = handlebars.compile(readFile('app_setting_list.html'));
var bagItProfileList = handlebars.compile(readFile('bagit_profile_list.html'));
var bagItProfileForm = handlebars.compile(readFile('bagit_profile_form.html'));
var bagItProfileNew = handlebars.compile(readFile('bagit_profile_new.html'));
var dashboard = handlebars.compile(readFile('dashboard.html'));
var jobFiles = handlebars.compile(readFile('job_files.html'));
var jobList = handlebars.compile(readFile('job_list.html'));
var jobPackaging = handlebars.compile(readFile('job_packaging.html'));
var jobReview = handlebars.compile(readFile('job_review.html'));
var jobStorage = handlebars.compile(readFile('job_storage.html'));
var jobSummaryPanel = handlebars.compile(readFile('job_summary_panel.html'));
var jobTags = handlebars.compile(readFile('job_tags.html'));
var manifest = handlebars.compile(readFile('manifest.html'));
var newTagFileForm = handlebars.compile(readFile('tag_file_new.html'));
var storageServiceForm = handlebars.compile(readFile('storage_service_form.html'));
var storageServiceList = handlebars.compile(readFile('storage_service_list.html'));
var tagDefinitionForm = handlebars.compile(readFile('tag_definition_form.html'));

handlebars.registerPartial({
	customTag: readFile('custom_tag.html'),
	inputCheckboxGroup: readFile('input_checkbox_group.html'),
	inputHidden: readFile('input_hidden.html'),
	inputPassword: readFile('input_password.html'),
	inputSelect: readFile('input_select.html'),
	inputText: readFile('input_text.html'),
	inputTextArea: readFile('input_textarea.html'),
	jobTabs: readFile('job_tabs.html'),
	profileTags: readFile('profile_tags.html'),
	tableBottomLinks: readFile('table_bottom_links.html')
});

handlebars.registerHelper('eq', function(a, b) {
  return a == b;
});

handlebars.registerHelper('jobFormTagField', function(tag) {
	return tag.toFieldForJobForm();
});

handlebars.registerHelper('resultSummary', function(result) {
    return result.summary();
});

module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
module.exports.bagItProfileForm = bagItProfileForm;
module.exports.bagItProfileList = bagItProfileList;
module.exports.bagItProfileNew = bagItProfileNew;
module.exports.dashboard = dashboard;
module.exports.jobFiles = jobFiles;
module.exports.jobList = jobList;
module.exports.jobPackaging = jobPackaging;
module.exports.jobReview = jobReview;
module.exports.jobSummaryPanel = jobSummaryPanel;
module.exports.jobStorage = jobStorage;
module.exports.jobTags = jobTags;
module.exports.manifest = manifest;
module.exports.newTagFileForm = newTagFileForm;
module.exports.storageServiceForm = storageServiceForm;
module.exports.storageServiceList = storageServiceList;
module.exports.tagDefinitionForm = tagDefinitionForm;
