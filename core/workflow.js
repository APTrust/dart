const { BagItProfile } = require('../bagit/bagit_profile');
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
 */
class Workflow extends PersistentObject {
    constructor(opts) {
        this.name = opts.name;
        this.description = opts.description;
        this.packageFormat = opts.packageFormat;
        this.packagePluginId = opts.packagePluginId;
        this.bagItProfileId = opts.bagItProfileId;
        this.storageServiceIds = opts.storageServiceIds || [];
    }

    /**
     * This returns the plugin class that provides the packaging
     * for this workflow.
     *
     */
    packagePlugin() {
        return PluginManager.findById(this.packagePluginId);
    }

    packagePluginName() {
        let name = null;
        let plugin = this.packagePlugin();
        if (plugin) {
            name = plugin.description().name;
        }
        return name;
    }

    bagItProfile() {
        return BagItProfile.find(this.bagItProfileId);
    }

    bagItProfileName() {
        let name = null;
        let profile = this.bagItProfile();
        if (profile) {
            name = profile.name;
        }
        return name;
    }

    storageServices() {
        let services = [];
        for (let id in this.storageServiceIds) {
            services.push(StorageService.find(id));
        }
        return services;
    }

    storageServiceNames() {
        let names = [];
        for(let service of this.storageServices()) {
            names.push(service.name);
        }
        return names;
    }
}
