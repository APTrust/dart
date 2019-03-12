const { PackageOperation } = require('../../core/package_operation');
const { PackageOperationForm } = require('./package_operation_form');

const tarWriterPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

function getOp() {
    let op = new PackageOperation('my_bag.tar', '/home/josie/dart/my_bag.tar');
    op.packageFormat = '.tar';
    op.pluginId = tarWriterPluginId;
    return op;
}

test('create()', () => {
    let op = getOp();
    let form = new PackageOperationForm(op);

    expect(form.fields['packageFormat']).toBeDefined();
    expect(form.fields['packageFormat'].name).toEqual('packageFormat');
    expect(form.fields['packageFormat'].value).toEqual('.tar');

    expect(form.fields['pluginId']).toBeDefined();
    expect(form.fields['pluginId'].name).toEqual('pluginId');
    expect(form.fields['pluginId'].value).toEqual(op.pluginId);

    expect(form.fields['outputPath']).toBeDefined();
    expect(form.fields['outputPath'].name).toEqual('outputPath');
    expect(form.fields['outputPath'].value).toEqual(op.outputPath);

    expect(form.fields['packageName']).toBeDefined();
    expect(form.fields['packageName'].name).toEqual('packageName');
    expect(form.fields['packageName'].value).toEqual(op.packageName);
});
