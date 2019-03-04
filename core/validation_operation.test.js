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
