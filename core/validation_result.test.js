const { ValidationResult } = require('./validation_result');

test('ValidationResult constructor initializes empty errors hash', () => {
    let result = new ValidationResult();
    expect(result.errors).toEqual({});
});
