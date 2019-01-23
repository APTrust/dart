const { UploadTarget } = require('../../core/upload_target');
const { Choice } = require('../common/choice');
const { Field } = require('../common/field');
const { Form } = require('../common/form');
const { PluginManager } = require('../../plugins/plugin_manager');

class UploadTargetForm {

    static create(uploadTarget) {
        var form = new Form('uploadTargetForm', uploadTarget);

        // TODO: Abstract to some I18N package?
        form.fields['port'].help = "The port to connect to on the remote server. You can usually leave this blank.";
        form.fields['bucket'].help = "The name of the bucket or default folder into which items should be uploaded.";
        form.fields['login'].help = "The login name or email address used to connect to the remote server. For S3 connections, this can be an AWS access key ID.";
        form.fields['password'].help = "The password used to connect to the remote server. For S3 connections, this can be the AWS secret access key.";
        form.fields['loginExtra'].help = "Leave this blank unless otherwise instructed.";

        let clients = [];
        for (let client of PluginManager.getModuleCollection('NetworkClient')) {
            let description = client.description();
            for (let protocol of description.implementsProtocols) {
                clients.push(protocol);
            };
        }
        form.fields['protocol'].choices = Choice.makeList(
            clients,
            uploadTarget.protocol,
            true
        );

        return form
    }

}

module.exports.UploadTargetForm = UploadTargetForm;
