const State = require('../core/state');
const { StorageService } = require('../core/storage_service');
const { StorageServiceForm } = require('./storage_service_form');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

class StorageServiceList {

    constructor() {
        // Nothing to do
    }

    initEvents() {
        $("#btnNewStorageService").on("click", this.onServiceClick);
        $('.clickable-row[data-object-type="StorageService"]').on("click", this.onServiceClick);
    }

    onServiceClick() {
        var id = $(this).data("object-id");
        var service = new es.StorageService();
        var showDeleteButton = false;
        if (!Util.isEmpty(id)) {
            service = StorageService.find(id);
            showDeleteButton = true;
        }
        var storageServiceForm = new StorageServiceForm(service);
        var data = {};
        data['form'] = storageServiceForm.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(Templates.storageServiceForm(data));
        State.ActiveObject = service;
    }
}

module.exports.StorageServiceList = StorageServiceList;
