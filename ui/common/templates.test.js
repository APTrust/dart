const $ = require('jquery');
const handlebars = require('handlebars');
const Templates = require('./templates');

// jest/jquery DOM: https://jestjs.io/docs/en/tutorial-jquery

test('Templates.nav sets correct active link', () => {
    document.body.innerHTML = Templates.nav({ section: 'Dashboard' });
    let cssClass = $('a:contains(Dashboard)').parent().attr('class');
    expect(cssClass).toEqual("nav-item active");

    document.body.innerHTML = Templates.nav({ section: 'Settings' });
    cssClass = $('a:contains(Settings)').parent().attr('class');
    expect(cssClass).toEqual("nav-item dropdown active");

    document.body.innerHTML = Templates.nav({ section: 'Jobs' });
    cssClass = $('a:contains(Jobs)').parent().attr('class');
    expect(cssClass).toEqual("nav-item dropdown active");

    document.body.innerHTML = Templates.nav({ section: 'Help' });
    cssClass = $('a:contains(Help)').parent().attr('class');
    expect(cssClass).toEqual("nav-item dropdown active");
});


test('All templates are defined', () => {
    // TODO: Uncomment as we go.
    let expectedTemplateNames = [
        "about",
        "appSettingForm",
        "appSettingList",
        // "bagItProfileForm",
        // "bagItProfileList",
        // "bagItProfileNew",
        // "dashboard",
        // "help",
        // "jobFiles",
        // "jobList",
        // "jobPackaging",
        // "jobReview",
        // "jobSummaryPanel",
        // "jobStorage",
        // "jobTags",
        // "log",
        // "manifest",
        "nav",
        // "newTagFileForm",
        // "setup",
        // "setupQuestion",
        // "uploadTargetForm",
        // "uploadTargetList",
        // "tagDefinitionForm",
        // "uploadOrRebag",
    ];
    for (let name of expectedTemplateNames) {
        expect(Templates[name]).toBeDefined();
    }
});


test('All partials are defined', () => {
    let expectedPartialNames = [
        'bannerAlert',
        'customTag',
        'formButtons',
        'inputCheckboxGroup',
        'inputHidden',
        'inputPassword',
        'inputSelect',
        'inputText',
        'inputTextArea',
        'jobTabs',
        'profileTags',
        'tableBottomLinks',
        'tagDefRow'
    ];
    let compiledPartialNames = Object.keys(handlebars.partials);
    expect(compiledPartialNames.length).toEqual(expectedPartialNames.length);

    for (let name of expectedPartialNames) {
        expect(compiledPartialNames).toContain(name);
    }
});
