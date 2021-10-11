const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { PersistentObject } = require('./persistent_object');
const { PluginManager } = require('../plugins/plugin_manager');
const { StorageService } = require('./storage_service');
const { Util } = require('./util');

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
 * For info on how to create a {@link Job} from a {@link Workflow},
 * see {@link Workflow.fromJob}.
 *
 * For info on how a {@link Workflow} becomes a {@link Job},
 * see {@link JobParams#toJob}.
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
        let duplicate = this.findDuplicate();
        if (duplicate) {
            this.errors["storageServiceIds"] = Context.y18n.__(
                "This workflow duplicates '%s'. Either delete this workflow, or change its package format, bagit profile, or upload targets.", duplicate.name
            );
        }
        return Object.keys(this.errors).length == 0;
    }

    /**
     * Returns the first Workflow that has the same packaging format and
     * upload targets as this Workflow. Returns null if there is no match.
     *
     * @returns {Workflow}
     */
    findDuplicate() {
        let self = this;
        let opts = { orderBy: 'name', sortDirection: 'asc', limit: 1, offset: 0 };
        let duplicate = null;
        let filter = function(wf) {
            return (wf.id != self.id &&
                    wf.packageFormat == self.packageFormat &&
                    wf.packagePluginId == self.packagePluginId &&
                    wf.bagItProfileId == self.bagItProfileId &&
                    Util.arrayContentsMatch(wf.storageServiceIds,
                                            self.storageServiceIds,
                                            false)
                   );
        }
        let matches = Workflow.list(filter, opts);
        if (matches && matches.length > 0) {
            duplicate = matches[0];
        }
        return duplicate;
    }

    /**
     * Returns a JSON version of this workflow suitable for use in
     * dart-runner. Note the exported JSON contains full representations
     * of the BagIt profile and storage services, instead of just containing
     * their IDs. This makes the JSON workflow self-contained and able to
     * be run on any dart-runner installation.
     *
     * @returns {string}
     */
    exportJson() {
        let workflow = this;
        let data = {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            packageFormat: workflow.packageFormat,
            packagePluginId: workflow.packagePluginId,
            packagePluginName: workflow.packagePluginName(),
            bagItProfile: workflow.bagItProfile(),
            storageServices: workflow.storageServices()
        }
        return JSON.stringify(data, null, 2)
    }

    /**
     * Given a {@link Job} object, this returns a Workflow that has
     * the same pattern as the Job.
     *
     * For info on how a {@link Workflow} becomes a {@link Job},
     * see {@link JobParams#toJob}.
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

    /**
     * This converts a generic object into an Workflow
     * object. this is useful when loading objects from JSON.
     *
     * @param {object} data - An object you want to convert to
     * a Workflow.
     *
     * @returns {Workflow}
     *
     */
    static inflateFrom(data) {
        let setting = new Workflow();
        Object.assign(setting, data);
        return setting;
    }

}

module.exports.Workflow = Workflow;
