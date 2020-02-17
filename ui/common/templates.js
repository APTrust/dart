const { Context } = require('../../core/context');
const dateFormat = require('dateformat');
const fs = require('fs');
const handlebars = require('handlebars')
const path = require('path');
const { Util } = require('../../core/util');

const templateDir = path.join(__dirname, "..", "templates");

// preventIndent prevents a problem in which the contents of
// multi-line textareas are indented, resulting in poor display
// and extraneous spaces in the textarea content.
// See https://handlebarsjs.com/reference.html
const compileOptions = {
    preventIndent: true
}

// Fix for handlebars breaking change described at
// https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access
// This affects the rendering of the jobs controller and the bagit profile
// controller.
const renderOptions = {
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true
}

function readFile(...args) {
    let filepath = path.join(templateDir, ...args)
    return fs.readFileSync(filepath, 'utf8');
}

function compile(pathToTemplate) {
    let html = fs.readFileSync(pathToTemplate, 'utf8');
    return handlebars.compile(html, compileOptions);
}

function compileHTML(html) {
    return handlebars.compile(html, compileOptions);
}

var about = compileHTML(readFile('about', 'index.html'));
var appSettingForm = compileHTML(readFile('app_setting', 'form.html'));
var appSettingList = compileHTML(readFile('app_setting', 'list.html'));
var bagItProfileList = compileHTML(readFile('bagit_profile', 'list.html'));
var bagItProfileForm = compileHTML(readFile('bagit_profile', 'form.html'));
var bagItProfileNew = compileHTML(readFile('bagit_profile', 'new.html'));
var bagItProfileExport = compileHTML(readFile('bagit_profile', 'export.html'));
var bagItProfileImport = compileHTML(readFile('bagit_profile', 'import.html'));
var dartProcessList = compileHTML(readFile('dart_process', 'list.html'));
var dashboard = compileHTML(readFile('dashboard', 'show.html'));
var importResult = compileHTML(readFile('settings', 'import_result.html'));
var internalSettingList = compileHTML(readFile('internal_setting', 'list.html'));
var jobFileRow = compileHTML(readFile('job', 'file_row.html'));
var jobFiles = compileHTML(readFile('job', 'files.html'));
var jobForm = compileHTML(readFile('job', 'form.html'));
var jobList = compileHTML(readFile('job', 'list.html'));
var jobPackaging = compileHTML(readFile('job', 'packaging.html'));
var jobMetadata = compileHTML(readFile('job', 'metadata.html'));
var jobNewTag = compileHTML(readFile('job', 'new_tag.html'));
var jobUpload = compileHTML(readFile('job', 'upload.html'));
var jobRun = compileHTML(readFile('job', 'run.html'));
var nav = compileHTML(readFile('nav.html'));
var pluginsList = compileHTML(readFile('plugins', 'list.html'));
var remoteRepositoryForm = compileHTML(readFile('remote_repository', 'form.html'));
var remoteRepositoryList = compileHTML(readFile('remote_repository', 'list.html'));
var storageServiceForm = compileHTML(readFile('storage_service', 'form.html'));
var storageServiceList = compileHTML(readFile('storage_service', 'list.html'));
var settingsExport = compileHTML(readFile('settings', 'export.html'));
var settingsExportResult = compileHTML(readFile('settings', 'export_result.html'));
var settingsImport = compileHTML(readFile('settings', 'import.html'));
var settingsQuestions = compileHTML(readFile('settings', 'questions_form.html'));
var settingsResponses = compileHTML(readFile('settings', 'responses.html'));
var setupEnd = compileHTML(readFile('setup', 'end.html'));
var setupError = compileHTML(readFile('setup', 'error.html'));
var setupList = compileHTML(readFile('setup', 'list.html'));
var setupStart = compileHTML(readFile('setup', 'start.html'));
var setupQuestion = compileHTML(readFile('setup', 'question.html'));
var tagDefinitionForm = compileHTML(readFile('tag_definition', 'form.html'));
var tagFileForm = compileHTML(readFile('tag_file', 'form.html'));
var workflowForm = compileHTML(readFile('workflow', 'form.html'));
var workflowList = compileHTML(readFile('workflow', 'list.html'));

handlebars.registerPartial({
    bannerAlert: readFile(path.join('partials', 'banner_alert.html')),
    customTag: readFile(path.join('partials', 'custom_tag.html')),
    dartProcess: readFile(path.join('partials', 'dart_process.html')),
    dashboardCard: readFile(path.join('partials', 'dashboard_card.html')),
    formButtons: readFile(path.join('partials', 'form_buttons.html')),
    inputCheckbox: readFile(path.join('partials', 'input_checkbox.html')),
    inputCheckboxGroup: readFile(path.join('partials', 'input_checkbox_group.html')),
    inputHidden: readFile(path.join('partials', 'input_hidden.html')),
    inputPassword: readFile(path.join('partials', 'input_password.html')),
    inputSelect: readFile(path.join('partials', 'input_select.html')),
    inputText: readFile(path.join('partials', 'input_text.html')),
    inputTextArea: readFile(path.join('partials', 'input_textarea.html')),
    jobTabs: readFile(path.join('partials', 'job_tabs.html')),
    profileTags: readFile(path.join('partials', 'profile_tags.html')),
    recentJobs: readFile(path.join('partials', 'recent_jobs.html')),
    runningJobs: readFile(path.join('partials', 'running_jobs.html')),
    settingsQuestion: readFile(path.join('settings', 'question.html')),
    tableBottomLinks: readFile(path.join('partials', 'table_bottom_links.html')),
    tagDefRow: readFile(path.join('partials', 'tag_def_row.html'))
});

handlebars.registerHelper('add', function(a, b) {
    return parseInt(a, 10) + parseInt(b, 10);
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

handlebars.registerHelper('showPathWithTrim', function(fullpath, trimpath) {
    let pattern = new RegExp('^' + trimpath);
    let replacement = `<span style="color: #ccc;">${trimpath}</span>`;
    return fullpath.trim().replace(pattern, replacement)
});

// Pre-compile partials so they can be called from within JS.
for(let [name, template] of Object.entries(handlebars.partials)) {
    handlebars.partials[name] = compileHTML(template);
}

module.exports.about = about;
module.exports.appSettingForm = appSettingForm;
module.exports.appSettingList = appSettingList;
module.exports.bagItProfileForm = bagItProfileForm;
module.exports.bagItProfileList = bagItProfileList;
module.exports.bagItProfileNew = bagItProfileNew;
module.exports.bagItProfileExport = bagItProfileExport;
module.exports.bagItProfileImport = bagItProfileImport;
module.exports.compile = compile;
module.exports.dashboard = dashboard;
module.exports.dartProcessList = dartProcessList;
module.exports.importResult = importResult;
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
module.exports.nav = nav;
module.exports.partials = handlebars.partials;
module.exports.pluginsList = pluginsList;
module.exports.remoteRepositoryForm = remoteRepositoryForm;
module.exports.remoteRepositoryList = remoteRepositoryList;
module.exports.renderOptions = renderOptions
module.exports.storageServiceForm = storageServiceForm;
module.exports.storageServiceList = storageServiceList;
module.exports.settingsExport = settingsExport;
module.exports.settingsExportResult = settingsExportResult;
module.exports.settingsImport = settingsImport;
module.exports.settingsQuestions = settingsQuestions;
module.exports.settingsResponses = settingsResponses;
module.exports.setupEnd = setupEnd;
module.exports.setupError = setupError;
module.exports.setupList = setupList;
module.exports.setupQuestion = setupQuestion;
module.exports.setupStart = setupStart;
module.exports.tagDefinitionForm = tagDefinitionForm;
module.exports.tagFileForm = tagFileForm;
module.exports.workflowForm = workflowForm;
module.exports.workflowList = workflowList;
