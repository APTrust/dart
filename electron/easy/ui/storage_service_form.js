const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Menu } = require('./menu');
const State = require('../core/state');
const { StorageService } = require('../core/storage_service');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

class StorageServiceForm {

    constructor(service) {
        this.service = service || new StorageService();
    }

    initEvents() {
        $("#btnStorageServiceSave").on("click", this.onSave());
        $("#btnStorageServiceDelete").on("click", this.onDelete());
    }

    onSave() {
        var self = this;
        return function() {
            self.service = StorageService.fromForm();
            var result = self.service.validate();
            es.State.ActiveObject = self.service;
            if (result.isValid()) {
                self.service.save();
                return Menu.storageServiceShowList(`Storage service ${self.service.name} has been saved`);
            } else {
                var form = self.service.toForm();
                form.setErrors(result.errors);
                var data = {};
                data['form'] = form;
                data['showDeleteButton'] = StorageService.find(service.id) != null;
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

}

module.exports.StorageServiceForm = StorageServiceForm;
