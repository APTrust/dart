const { Choice } = require('../core/choice');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Menu } = require('./menu');
const Plugins = require('../plugins/plugins');
const State = require('../core/state');
const { StorageService } = require('../core/storage_service');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

class StorageServiceForm {

    constructor(service) {
        this.service = service || new StorageService();
    }

    initEvents() {
        $("#btnStorageServiceSave").off("click");
        $("#btnStorageServiceDelete").off("click");

        $("#btnStorageServiceSave").on("click", this.onSave());
        $("#btnStorageServiceDelete").on("click", this.onDelete());
    }

    onSave() {
        var self = this;
        return function() {
            self.service = self.fromForm();
            var result = self.service.validate();
            es.State.ActiveObject = self.service;
            if (result.isValid()) {
                self.service.save();
                return Menu.storageServiceShowList(`Storage service ${self.service.name} has been saved`);
            } else {
                var form = self.toForm();
                form.setErrors(result.errors);
                var data = {};
                data['form'] = form;
                data['showDeleteButton'] = StorageService.find(self.service.id) != null;
                $("#container").html(Templates.storageServiceForm(data));
            }
        }
    }

    onDelete() {
        var self = this;
        return function() {
            if (!confirm("Delete this storage service?")) {
                return;
            }
            State.ActiveObject.delete();
            Menu.storageServiceShowList(`Deleted storage service ${self.service.name}`);
        }
    }

    toForm() {
        var form = new Form('storageServiceForm');
        form.fields['id'] = new Field('storageServiceId', 'id', 'id', this.service.id);
        form.fields['name'] = new Field('storageServiceName', 'name', 'Name', this.service.name);
        form.fields['description'] = new Field('storageServiceDescription', 'description', 'Description', this.service.description);
        form.fields['protocol'] = new Field('storageServiceProtocol', 'protocol', 'Protocol', this.service.protocol);
        form.fields['protocol'].choices = Choice.makeList(Plugins.listStorageProviders(), this.service.protocol, true);
        form.fields['host'] = new Field('storageServiceHost', 'host', 'Host', this.service.host);
        form.fields['host'].help = "The name of the server to connect to. For example, s3.amazonaws.com."
        form.fields['port'] = new Field('storageServicePort', 'port', 'Port', this.service.port);
        form.fields['port'].help = "The port number to connect to. Leave this blank if you're in doubt."
        form.fields['bucket'] = new Field('storageServiceBucket', 'bucket', 'Bucket or Default Folder', this.service.bucket);
        form.fields['loginName'] = new Field('storageServiceLoginName', 'loginName', 'Login Name', this.service.loginName);
        form.fields['loginName'].help = "Login name or S3 Access Key ID.";
        form.fields['loginPassword'] = new Field('storageServiceLoginPassword', 'loginPassword', 'Password or Secret Key', this.service.loginPassword);
        form.fields['loginPassword'].help = "Password or S3 secret access key.";
        form.fields['loginExtra'] = new Field('storageServiceLoginExtra', 'loginExtra', 'Login Extra', this.service.loginExtra);
        form.fields['loginExtra'].help = "Additional login info to pass to the service. Most services don't use this.service.";
        return form
    }

    fromForm() {
        var name = $('#storageServiceName').val().trim();
        var service = new StorageService(name);
        service.id = $('#storageServiceId').val().trim();
        service.description = $('#storageServiceDescription').val().trim();
        service.protocol = $('#storageServiceProtocol').val().trim();
        service.host = $('#storageServiceHost').val().trim();
        service.port = $('#storageServicePort').val().trim();
        service.bucket = $('#storageServiceBucket').val().trim();
        service.loginName = $('#storageServiceLoginName').val().trim();
        service.loginPassword = $('#storageServiceLoginPassword').val().trim();
        service.loginExtra = $('#storageServiceLoginExtra').val().trim();
        return service
    }

}

module.exports.StorageServiceForm = StorageServiceForm;
