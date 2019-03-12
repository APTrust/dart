const { Job } = require('../../core/job');
const { JobPackageOpForm } = require('./job_package_op_form');
const { PackageOperation } = require('../../core/package_operation');

const tarWriterPluginId = '90110710-1ff9-4650-a086-d7b23772238f';

function getJob() {
    let job = new Job()
    job.packageOp = new PackageOperation('my_bag.tar', '/home/josie/dart/my_bag.tar');
    job.packageOp.packageFormat = '.tar';
    job.packageOp.pluginId = tarWriterPluginId;
    return job;
}

test('create()', () => {
    let job = getJob();
    let form = new JobPackageOpForm(job);

    expect(form.fields['packageFormat']).toBeDefined();
    expect(form.fields['packageFormat'].name).toEqual('packageFormat');
    expect(form.fields['packageFormat'].value).toEqual('.tar');

    expect(form.fields['pluginId']).toBeDefined();
    expect(form.fields['pluginId'].name).toEqual('pluginId');
    expect(form.fields['pluginId'].value).toEqual(job.packageOp.pluginId);

    expect(form.fields['outputPath']).toBeDefined();
    expect(form.fields['outputPath'].name).toEqual('outputPath');
    expect(form.fields['outputPath'].value).toEqual(job.packageOp.outputPath);

    expect(form.fields['packageName']).toBeDefined();
    expect(form.fields['packageName'].name).toEqual('packageName');
    expect(form.fields['packageName'].value).toEqual(job.packageOp.packageName);
});
