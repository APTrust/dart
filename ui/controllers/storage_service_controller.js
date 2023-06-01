const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { PluginManager } = require('../../plugins/plugin_manager');
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

    testConnection() {
        let controller = this
        let ss = this.model.find(this.params.get('id')) || new this.model();
        let form = new this.formClass(ss);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = this.formTemplate({ form: form }, Templates.renderOptions);
            return this.containerContent(html);
        }
        ss.save();
        let providerClass = this.getProvider(ss.protocol);
        try {
            providerClass = this.getProvider(ss.protocol); 
        } catch (err) {
            alert(err.toString())
            return
        }
        let provider = new providerClass(ss);

        let showTestResult = function(message, color) {
            let element = document.getElementById('ssConnectionTestResult')
            if (element) {
                element.innerText = message
                element.style.color = color
            }
        }
        provider.on('connected', function(message) {
            showTestResult(message, 'green')
        })
        provider.on('error', function(err) {
            showTestResult(err, 'red')
        })

        // Set this as an object-level property, so we
        // can reference it in the postRenderCallback.
        // We can't call it until the modal dialog is
        // loaded and the ssConnectionTestResult element
        // is present.
        controller.providerToTest = provider

        let title = Context.y18n.__("Connection Test")
        let html = Templates.storageServiceTest({ storageService: ss })

        return this.modalContent(title, html)
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
        if (fnName == 'testConnection' && this.providerToTest) {
            // Test the connection here, after the modal is rendered.
            this.providerToTest.testConnection()
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

    /**
     * This returns the first network provider plugin that implements the
     * S3 protocol. If it can't find a plugin for the S3 protocol, it throws
     * an exception.
     *
     * @returns {Plugin}
     */
    getProvider(protocol) {
        let providers = PluginManager.implementsProtocol(protocol);
        if (providers.length == 0) {
            throw `Cannot find a plugin that implements the ${protocol} protocol.`
        }
        return providers[0];
    }    
}

module.exports.StorageServiceController = StorageServiceController;
