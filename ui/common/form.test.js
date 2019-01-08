const { Field } = require('./field');
const { Form } = require('./form');

test('Constructor sets expected properies', () => {
    let form = new Form('id-1234');
    expect(form.id).toEqual('id-1234');
    expect(form.fields).toEqual({});
    expect(form.inlineForms).toEqual([]);
});

test('setErrors()', () => {
    let form = new Form('id-1234');
    for(let i = 0; i < 10; i++) {
        let field = new Field('id' + i, 'field_' + i, 'label' + i, 'value' + i);
        form.fields[field.name] = field;
    }

    let errors = {
        'field_3': 'Error in field 3',
        'field_6': 'Error in field 6'
    }

    form.setErrors(errors);

    let errorsSet = 0;
    for (let name of Object.keys(form.fields)) {
        var field = form.fields[name];
        if (name === 'field_3') {
            expect(field.error).toEqual('Error in field 3');
            errorsSet++;
        } else if (name === 'field_6') {
            expect(field.error).toEqual('Error in field 6');
            errorsSet++;
        } else {
            expect(field.error).toEqual('');
        }
    }
    expect(errorsSet).toEqual(2);
});
