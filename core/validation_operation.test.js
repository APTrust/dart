const { Context } = require('./context');
const { ValidationOperation } = require('./validation_operation');

test('inflateFrom()', () => {
    let data = {
        pathToBag: '/home/abc/bag.tar',
        errors: ['one', 'two', 'three'],
        result: {
            operation: 'lobotomy',
            provider: 'the news media'
        }
    };
    let op = ValidationOperation.inflateFrom(data);
    expect(op.pathToBag).toEqual(data.pathToBag);
    expect(op.errors).toEqual(data.errors);
    expect(op.result).not.toBeNull();
    expect(op.result.operation).toEqual(data.result.operation);
});

test('validate()', () => {
    let validationOp = new ValidationOperation();
    let result = validationOp.validate();
    expect(result).toBe(false);
    expect(validationOp.errors['ValidationOperation.pathToBag']).toEqual(Context.y18n.__('You must specify the path to the bag you want to validate.'));

    validationOp.pathToBag = '__1/file/does/not/exist';
    result = validationOp.validate();
    expect(result).toBe(false);
    expect(validationOp.errors['ValidationOperation.pathToBag']).toEqual(Context.y18n.__('The bag to be validated does not exist at %s', validationOp.pathToBag));

    validationOp.pathToBag = __filename;
    result = validationOp.validate();
    expect(result).toBe(true);
    expect(validationOp.errors['ValidationOperation.pathToBag']).not.toBeDefined();
});
