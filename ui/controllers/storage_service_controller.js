const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { StorageService } = require('../../core/storage_service');
const { StorageServiceForm } = require('../forms/storage_service_form');
const Templates = require('../common/templates');
const y18n = require('y18n');

// This allows us to convert query string params
// to their proper types. No need to specify strings, since
// they don't need to be converted.
const typeMap = {
    userCanDelete: 'boolean',
    port: 'number'
}

class StorageServiceController extends BaseController {

    constructor(params) {
        super(params, 'Settings');
        this.typeMap = typeMap;

        this.model = StorageService;
        this.formClass = StorageServiceForm;
        this.formTemplate = Templates.storageServiceForm;
        this.listTemplate = Templates.storageServiceList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'name';
        this.defaultSortDirection = 'asc';
    }

    /**
     * This attaches required events to the Job files UI and
     * adds the list of files and folders to be packaged to
     * the UI.
     */
    postRenderCallback(fnName) {
        if (fnName == 'edit' || fnName == 'new') {
            this.attachProtocolChangeEvents()
        }
    }

    attachProtocolChangeEvents() {
        document.getElementById('storageServiceForm_protocol').addEventListener("change", function(event) {
            let loginLabel = document.querySelector('label[for=storageServiceForm_login]')
            let passwordLabel = document.querySelector('label[for=storageServiceForm_password]')
            let protocol = document.getElementById('storageServiceForm_protocol').value 
            if (protocol == 's3') {
                loginLabel.innerText = Context.y18n.__('Access Key Id')
                passwordLabel.innerText = Context.y18n.__('Secret Access Key')
            } else {
                loginLabel.innerText = Context.y18n.__('Login')
                passwordLabel.innerText = Context.y18n.__('Password')
            }
        });
    }
}

module.exports.StorageServiceController = StorageServiceController;
