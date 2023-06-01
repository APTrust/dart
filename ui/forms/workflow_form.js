const $ = require('jquery');
const { BagItProfile } = require('../../bagit/bagit_profile');
const { Choice } = require('./choice');
const { Context } = require('../../core/context');
const { Field } = require('./field');
const { Form } = require('./form');
const { PluginManager } = require('../../plugins/plugin_manager');
const { StorageService } = require('../../core/storage_service');
const { Util } = require('../../core/util');

/**
 * WorkflowForm allows the user to define a workflow.
 */
class WorkflowForm extends Form {

    constructor(workflow) {
        super('Workflow', workflow);
        this._init(workflow);
    }

    _init() {
        this._initPackageFormatList();
        this._initBagItProfileList();
        this._initStorageServiceList();
    }

    _initPackageFormatList() {
        let formats = [
            {
                id: 'None',
                name: 'None'
            },
            {
                id: 'BagIt',
                name: 'BagIt'
            }
        ];
        for (let writer of PluginManager.getModuleCollection('FormatWriter')) {
            let description = writer.description();
            for (let format of description.writesFormats) {
                formats.push({
                    id: description.id,
                    name: format
                });
            };
        }
        this.fields['packageFormat'].choices = Choice.makeList(
            formats,
            this.obj.packageFormat,
            false
        );
    }

    _initBagItProfileList() {
        var profiles = BagItProfile.list(null, {
            limit: 0,
            offset: 0,
            orderBy: 'name',
            sortDirection: 'asc'
        });
        this.fields['bagItProfileId'].choices = Choice.makeList(
            profiles,
            this.obj.bagItProfileId,
            true
        );
        this.fields['bagItProfileId'].help = Context.y18n.__('JobPackageOp_bagItProfileId_help');
    }

    _initStorageServiceList() {
        let listOptions = {
            orderBy: 'name',
            sortDirection: 'asc'
        }
        let filterFn = function(ss) { return ss.allowsUpload };
        this.fields['storageServiceIds'].choices = Choice.makeList(
            StorageService.list(filterFn, listOptions),
            this.obj.storageServiceIds,
            false
        );
    }

    parseFromDOM() {
        super.parseFromDOM();
        let selectedPluginId = this.obj.packageFormat;
        let formatName = $('#workflowForm_packageFormat option:selected').text();
        this.obj.packagePluginId = selectedPluginId;
        if (formatName) {
            this.obj.packageFormat = formatName.trim();
        }
    }

}

module.exports.WorkflowForm = WorkflowForm;
