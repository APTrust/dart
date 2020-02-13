const { ExportQuestion } = require('../../core/export_question');
const { ExportSettings } = require('../../core/export_settings');
const { SettingsQuestionsForm } = require('./settings_questions_form');
const { TestUtil } = require('../../core/test_util');

test('constructor()', () => {
    let form = new SettingsQuestionsForm(new ExportSettings());

    // ExportSettings with no questions should have fields
    // for one new question, but no more.
    expect(form.fields['prompt_0']).toBeDefined();
    expect(form.fields['objType_0']).toBeDefined();
    expect(form.fields['objId_0']).toBeDefined();
    expect(form.fields['field_0']).toBeDefined();

    expect(form.fields['prompt_1']).not.toBeDefined();
    expect(form.fields['objType_1']).not.toBeDefined();
    expect(form.fields['objId_1']).not.toBeDefined();
    expect(form.fields['field_1']).not.toBeDefined();
});


// TODO: Test constructor with existing questions.
