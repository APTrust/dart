const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('./storage_service');

/**
 * A workflow defines the set up steps that compose a job. These
 * steps may include packaging, validation, and uploading
 * to one or more storage services.
 *
 * If the packaging format is BagIt, the Workflow should include
 * a BagIt profile as well.
 *
 * A workflow allows users to define a repeatable set of actions,
 * and to run jobs based on those pre-defined actions.
 *
 * @param {object} opts
 *
 * @param {string} opts.name - The name to assign to this Workflow.
 *
 * @param {string} [opts.description] - An optional description of
 * this workflow.
 *
 * @param {string} [opts.packageFormat] - The package format, if this
 * workflow includes a packaging step. Options include "None", "BagIt",
 * or the UUID of any format/write plugin.
 *
 * @param {string} [opts.packagePluginId] - The id of the plugin that
 * will write the package to disk, if there is a packaging step.
 *
 * @param {string} [opts.bagItProfileId] - The id of the BagIt profile
 * to be used in the packaging step, if there is a packaging step. If
 * this is specified, the package will be a bag that conforms to this
 * profile.
 *
 * @param {Array<string>} [opts.storageServiceIds] - A list of
 * {@link StorageService} ids. The workflow will upload files to these
 * storage services.
 *
 */
class Workflow extends PersistentObject {
    constructor(opts = {}) {
        opts.required = ["name"];
        super(opts);
        /**
         * The name of this workflow.
         *
         * @type {string}
         */
        this.name = opts.name;
        /**
         * A description of this workflow.
         *
         * @type {string}
         */
        this.description = opts.description;
        /**
         * The package format, if this workflow includes a
         * packaging step. Options include "None", "BagIt",
         * or the UUID of any format/write plugin.
         *
         * @type {string}
         */
        this.packageFormat = opts.packageFormat;
        /**
         * The id of the plugin that will write the
         * package to disk, if there is a packaging step.
         *
         * @type {string}
         */
        this.packagePluginId = opts.packagePluginId;
        /**
         * The id of the BagIt profile to be used in the
         * packaging step, if there is a packaging step. If
         * this is specified, the package will be a bag that
         * conforms to this profile.
         *
         * @type {string}
         */
        this.bagItProfileId = opts.bagItProfileId;
        /**
         * A list of {@link StorageService} ids. The workflow
         * will upload files to these storage services.
         *
         * @type {string}
         */
        this.storageServiceIds = opts.storageServiceIds || [];
    }

    /**
     * This returns the plugin class that provides the packaging
     * for this workflow. Note that this returns a class and not
     * an instance of an object.
     *
     * @returns {function}
     */
    packagePlugin() {
        return PluginManager.findById(this.packagePluginId);
    }

    /**
     * Returns the name of the plugin that will be used to package
     * data in this workflow.
     *
     * @returns {string}
     */
    packagePluginName() {
        let name = null;
        let plugin = this.packagePlugin();
        if (plugin) {
            name = plugin.description().name;
        }
        return name;
    }

    /**
     * This returns the BagItProfile the workflow will use to generate
     * bags.
     *
     * @returns {BagItProfile}
     */
    bagItProfile() {
        return BagItProfile.find(this.bagItProfileId);
    }

    /**
     * Returns the name of the BagItProfile that will be used to
     * create bags in this workflow (if there is one).
     *
     * @returns {string}
     */
    bagItProfileName() {
        let name = null;
        let profile = this.bagItProfile();
        if (profile) {
            name = profile.name;
        }
        return name;
    }

    /**
     * Returns an array of {@link StorageService} objects. The workflow
     * will upload files to each of these services.
     *
     * @returns {Array<StorageService>}
     */
    storageServices() {
        let services = [];
        for (let id of this.storageServiceIds) {
            services.push(StorageService.find(id));
        }
        return services;
    }

    /**
     * Returns the names of the {@link StorageService}s to which this
     * workflow will upload files.
     *
     * @returns {Array<string>}
     */
    storageServiceNames() {
        let names = [];
        for(let service of this.storageServices()) {
            names.push(service.name);
        }
        return names;
    }

    /**
     * Checks to see if this workflow has a unique non-empty name.
     * Returns true if so, false otherwise.
     *
     * @returns {boolean}
     */
    validate() {
        super.validate();
        let wf = Workflow.firstMatching('name', this.name);
        if (wf && wf.id != this.id) {
            this.errors["name"] = Context.y18n.__(
                "%s must be unique", "name"
            );
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * Given a {@link Job} object, this returns a Workflow that has
     * the same pattern as the Job.
     *
     * @param {Job}
     *
     * @returns {Workflow}
     */
    static fromJob(job) {
        let profileId = job.bagItProfile ? job.bagItProfile.id : null;
        let packageFormat = job.packageOp ? job.packageOp.packageFormat : 'None';
        let pluginId = job.packageOp ? job.packageOp.pluginId : null;
        let ssids = job.uploadOps ? job.uploadOps.map(op => op.storageServiceId) : [];
        return new Workflow({
            name: '',
            description: '',
            packageFormat: packageFormat,
            packagePluginId: pluginId,
            bagItProfileId: profileId,
            storageServiceIds: ssids
        });
    }
}

module.exports.Workflow = Workflow;
