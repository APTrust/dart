const $ = require('jquery');
const { SetupQuestion } = require('./setup_question');
const Templates = require('../common/templates');
const { UITestUtil } = require('../common/ui_test_util');

const opts1 = {
    question: 'What time is it?',
    heading: 'Question 1',
    initialValue: '10:00',
    error: 'I asked you what time it is.',
    choices: ['9:00', '10:00', '11:00'],
    validator: function(value) {
        return value == '11:00';
    },
    onValidResponse: jest.fn(data => data != null)
}

test('Constructor sets expected fields', () => {
    let q = new SetupQuestion(opts1);
    expect(q.label).toEqual(opts1.question);
    expect(q.heading).toEqual(opts1.heading);
    expect(q.value).toEqual(opts1.initialValue);
    expect(q.error).toEqual(opts1.error);
    expect(q.choices).toEqual(opts1.choices);
    expect(q.validator).toEqual(opts1.validator);
    expect(q.onValidResponse).toEqual(opts1.onValidResponse);
});

test('Constructor requires onValidResponse', () => {
    expect(function() {
        Context.logger.silly("Test silly message")
        new SetupQuestion({
            question: "How much wood would a woodchuck chuck..."
        })
    }).toThrow();
});

test('readUserInput()', () => {
    let q = new SetupQuestion(opts1);
    let html = Templates.partials['inputText']({
        field: q
    })

    UITestUtil.setDocumentBody({ container: html});
    expect(q.readUserInput()).toEqual(opts1.initialValue);

    $(`#${q.id}`).val('12345678');
    expect(q.readUserInput()).toEqual('12345678');

    // Check casting
    q.dataType = 'number';
    $(`#${q.id}`).val('88');
    expect(q.readUserInput()).toEqual(88);

    q.dataType = 'boolean';
    $(`#${q.id}`).val('true');
    expect(q.readUserInput()).toBe(true);
    $(`#${q.id}`).val('false');
    expect(q.readUserInput()).toBe(false);

});

test('processResponse returns false if invalid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '12:00' });
    expect(q.processResponse()).toBe(false);
});

test('processResponse does not call onValidResponse if invalid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '12:00' });
    q.processResponse()
    // q.onValidResponse is a assigned a mock from opts1
    expect(q.onValidResponse).not.toHaveBeenCalled();
});

test('processResponse returns true if valid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '11:00' });
    expect(q.processResponse()).toBe(true);
});

test('processResponse calls onValidResponse if valid', () => {
    let q = new SetupQuestion(opts1);
    q.readUserInput = jest.fn(() => { return '11:00' });
    q.processResponse()
    // q.onValidResponse is a assigned a mock from opts1
    expect(q.onValidResponse).toHaveBeenCalled();
});

test('getRequiredValidator()', () => {
    let v = SetupQuestion.getRequiredValidator();
    expect(typeof v).toEqual('function');
    expect(v('1008')).toBe(true);
    expect(v(1008)).toBe(true);
    expect(v(true)).toBe(true);
    expect(v(false)).toBe(true);
    expect(v('')).toBe(false);
    expect(v()).toBe(false);
    expect(v(null)).toBe(false);
});

test('getPatternValidator()', () => {
    let v = SetupQuestion.getPatternValidator(/^\d+$/);
    expect(typeof v).toEqual('function');
    expect(v('1008')).toBe(true);
    expect(v('Doh!')).toBe(false);
});

test('getIntRangeValidator()', () => {
    let v = SetupQuestion.getIntRangeValidator(1, 10);
    expect(typeof v).toEqual('function');
    expect(v(1)).toBe(true);
    expect(v(10)).toBe(true);
    expect(v('1')).toBe(true);
    expect(v('10')).toBe(true);
    expect(v(20)).toBe(false);
    expect(v('')).toBe(false);
    expect(v()).toBe(false);

    // Allow empty value
    v = SetupQuestion.getIntRangeValidator(1, 10, true);
    expect(v('10')).toBe(true);
    expect(v(20)).toBe(false);
    expect(v('')).toBe(true);
    expect(v()).toBe(true);
});
