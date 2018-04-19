const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('./bagit_profile');
const { BagItProfileInfo } = require('./bagit_profile_info');
const { Choice } = require('./choice');
const Const = require('./constants');
const { Field } = require('./field');
const { Form } = require('./form');
const { JobOptions } = require('./job_options');
const { OperationResult } = require('./operation_result');
const Plugins = require('../plugins/plugins');
const { StorageService } = require('./storage_service');
const { Util } = require('./util');
const { ValidationResult } = require('./validation_result');

const Store = require('electron-store');
var db = new Store({name: 'jobs'});


const macJunkFile = /._DS_Store$|.DS_Store$/i;
const dotFile = /\/\.[^\/]+$|\\\.[^\\]+$/;
const dotKeepFile = /\/\.keep$|\\\.keep$/i;

class Job {
    constructor() {
        this.id = Util.uuid4();
        this.bagName = "";
        this.baggingDirectory = "";
        this.files = [];
        this.packageFormat = null;
        this.bagItProfile = null;
        this.storageServices = [];
        this.options = new JobOptions();
        this.operationResults = [];
        this.packagedFile = "";
        this.created = null;
        this.updated = null;

        // payloadSize is the total size, in bytes,
        // of the files to be packaged.
        this.payloadSize = 0;

        // The repository plugin should set this timestamp
        // when it sees that the item has been ingested
        // by the remote repository. See plugins/repository/aptrust.js
        // for an example. Jobs with non-null ingestedAt timestamps
        // will not be displayed in the jobs list, because they
        // have been completed and don't need to be accidentally
        // run again (several depositors have done this). In APTrust,
        // re-ingesting a bag can mean overwriting a bag, and we
        // don't want people to do that unless they clearly intend it.
        this.ingestedAt = null;

        var setting = AppSetting.findByName("Bagging Directory");
        if (setting != null) {
            this.baggingDirectory = setting.value;
        }
    }
    objectType() {
        return 'Job';
    }

    displayName() {
        var dateString = this.displayDateCreated();
        var name = `Job created ${dateString}`
        if (this.bagName != null && this.bagName.trim() != "") {
            name = this.bagName;
        }
        return name;
    }

    displayDateCreated() {
        return dateFormat(this.created, 'shortDate') + " " + dateFormat(this.created, 'shortTime');
    }

    displayDateUpdated() {
        return dateFormat(this.updated, 'shortDate') + " " + dateFormat(this.updated, 'shortTime');
    }

    packageStatus() {
        var status = "";
        for (var result of this.operationResults) {
            var datetime = dateFormat(result.completed, 'shortDate') + " " + dateFormat(result.completed, 'shortTime');
            if (result.operation == "package") {
                if (result.succeeded) {
                    status = datetime
                } else {
                    status = `${datetime} (failed)`
                }
            }
        }
        return status;
    }

    storageStatus() {
        var status = "";
        for (var result of this.operationResults) {
            var datetime = dateFormat(result.completed, 'shortDate') + " " + dateFormat(result.completed, 'shortTime');
            if (result.operation == "storage") {
                if (result.succeeded) {
                    status = datetime
                } else {
                    status = `${datetime} (failed)`
                }
            }
        }
        return status;
    }

    displayTitle() {
        var title = "";
        var tagNames = ["Title", "Description", "Internal-Sender-Identifier",
                        "Local-ID",  "External-Description", "Internal-Sender-Description",
                        "External-Identifier"]
        if (this.bagItProfile != null) {
            var tag = this.bagItProfile.firstTagWithMatchingName(tagNames);
            if (tag != null) {
                title = tag.userValue;
            }
        }
        return title;
    }

    clearFiles() {
        this.files = [];
    }

    hasFile(filepath) {
        if (!this.hasFiles) {
            return false;
        }
        if (!Job.shouldIncludeFile(filepath, this.options)) {
            return false;
        }
        var included = false;
        for (var f of this.files) {
            if (filepath == f || filepath.startsWith(f + path.sep)) {
                included = true;
                break;
            }
        }
        return included;
    }

    hasFiles() {
        return this.files != null && this.files.length > 0;
    }

    static shouldIncludeFile(filepath, options) {
        // Return false if this file should be filtered out of the package.
        var isMacJunk = filepath.match(macJunkFile);
        var isHidden = filepath.match(dotFile);
        var isDotKeep = filepath.match(dotKeepFile);
        var skipMacJunk = (options.skipDSStore || options.skipDotKeep || options.skipHiddenFiles);

        if (isMacJunk && skipMacJunk) {
            return false;
        }
        else if (isDotKeep && options.skipDotKeep) {
            return false;
        }
        else if (isHidden && options.skipHiddenFiles) {
            return false;
        }
        return true;
    }

    validate() {
        var result = new ValidationResult();
        if (this.files == null || this.files.length == 0) {
            result.errors["files"] = ["This job has no files."];
        }
        if (this.bagItProfile == null && (this.storageServices == null || this.storageServices.length == 0)) {
            result.errors["general"] = ["This job must have either a BagIt Profile, or a Storage Service, or both."];
        }
        if (this.packageFormat == 'BagIt' && this.bagItProfile == null) {
            result.errors["bagItProfile"] = ["You must specify a BagIt Profile."];
        }
        if (this.bagItProfile != null) {
            if (this.baggingDirectory == "" || this.baggingDirectory == null) {
                result.errors["baggingDirectory"] = ["You must specify a bagging directory."];
            }
            let errors = []
            var profileResult = this.bagItProfile.validate();
            if (!profileResult.isValid()) {
                for (var k of Object.keys(profileResult.errors)) {
                    errors.push(profileResult.errors[k])
                }
            }
            for (var tag of this.bagItProfile.requiredTags) {
                for (var err of tag.validateForJob()) {
                    errors.push(err);
                }
            }
            if (errors.length > 0) {
                result.errors['bagItProfile'] = errors;
            }
        }
        if (this.storageServices != null) {
            let errors = []
            for (var ss of this.storageServices) {
                var ssResult = ss.validate();
                if (!ssResult.isValid()) {
                    for (var k of Object.keys(ssResult.errors)) {
                        errors.push(profileResult.errors[k])
                    }
                }
            }
            if (errors.length > 0) {
                result.errors['storageServices'] = errors;
            }
        }
        return result;
    }

    resetFileOptions() {
        this.options.skipDSStore = true;
        this.options.skipHiddenFiles = false;
        this.options.skipDotKeep = false;
    }

    toPackagingForm() {
        var availableProfiles = Util.sortByName(BagItProfile.getStore());
        var profileId = null;
        if (this.bagItProfile != null) {
            profileId = this.bagItProfile.id;
        }
        var form = new Form();
        form.fields['bagName'] = new Field("bagName", "bagName", "Bag Name", this.bagName);
        form.fields['bagName'].help = "Provide a name for the bag you want to create. You can leave this blank if you're not creating a bag.";
        form.fields['baggingDirectory'] = new Field("baggingDirectory", "baggingDirectory", "Bagging Directory", this.baggingDirectory);
        form.fields['baggingDirectory'].help = "Where should the bag be assembled?";
        form.fields['packageFormat'] = new Field("packageFormat", "packageFormat", "Packaging Format", "");
        form.fields['packageFormat'].help = "Select a packaging format, or None if you just want to send files to the storage area as-is.";
        var choices = Choice.makeList(Plugins.listPackageProviders(), this.packageFormat, true);
        choices[0].value = "";
        choices[0].label = "None";
        form.fields['packageFormat'].choices = choices;

        form.fields['profile'] = new Field("profile", "profile", "BagIt Profile", "");
        form.fields['profile'].help = "Select a BagIt profile.";
        var choices = Choice.makeList(availableProfiles, profileId, true);
        choices[0].value = "";
        choices[0].label = "None";
        form.fields['profile'].choices = choices;
        return form;
    }

    toStorageServiceForm() {
        var availableServices = Util.sortByName(StorageService.getStore());
        var form = new Form();
        form.fields['storageServices'] = new Field("storageServices", "storageServices", "Storage Services", this.storageServices);
        var selectedIds = this.storageServices.map(ss => ss.id);
        form.fields['storageServices'].choices = Choice.makeList(availableServices, selectedIds, false);
        return form;
    }

    save() {
        if (this.created == null) {
            this.created = new Date().toJSON();
        }
        this.updated = new Date().toJSON();
        return db.set(this.id, this);
    }

    static find(id) {
        var obj = db.get(id);
        return Job.inflateFromJson(obj);
    }

    static inflateFromJson(jsonObj) {
        var job = null;
        if (jsonObj != null) {
            job = new Job();
            Object.assign(job, jsonObj);
        }
        job.options = new JobOptions();
        Object.assign(job.options, jsonObj.options);
        if (jsonObj.bagItProfile != null) {
            job.bagItProfile = BagItProfile.toFullObject(jsonObj.bagItProfile);
        }
        for (var i=0; i < jsonObj.storageServices.length; i++) {
            var ss = new StorageService();
            Object.assign(ss, jsonObj.storageServices[i]);
            job.storageServices[i] = ss;
        }
        for (var i=0; i < jsonObj.operationResults.length; i++) {
            var result = new OperationResult();
            Object.assign(result, jsonObj.operationResults[i]);
            job.operationResults[i] = result;
        }
        return job;

    }

    delete() {
        db.delete(this.id);
        return this;
    }


    // TODO: Much of getStore, list, nextLink, and previousLink
    // is common to AppSetting, BagItProfile, Job, and StorageService.
    // Factor this out to common code.

    getStore() {
        return db.store;
    }

    // TODO: Change args to an options hash.
    static list(limit = 50, offset = 0, sortBy = 'updated', sortDir = 'desc', skipIngested = false) {
        var items = [];
        var allItems = Util.sort(Job.getStore(), sortBy, sortDir);
        var end = Math.min((offset + limit), allItems.length);
        for (var i = offset; i < end; i++) {
            var item = allItems[i];
            if (skipIngested && item.ingestedAt != null) {
                continue;
            }
            items.push(Job.inflateFromJson(item));
        }
        return items;
    }

    static nextLink(limit = 50, offset = 0) {
        if (offset + limit < Object.keys(db.store).length) {
            var nextOffset = offset + limit
            return `es.UI.Menu.jobList('', ${limit}, ${nextOffset})`;
        }
        return "";
    }

    static previousLink(limit = 50, offset = 0) {
        if (offset > 0) {
            var prevOffset = Math.max((offset - limit), 0);
            return `es.UI.Menu.jobList('', ${limit}, ${prevOffset})`;
        }
        return "";
    }

    // returns a data hash for the job_tags.html template.
    dataForTagEditor() {
        var data = {};
        // PT #154193552: DPN-Object-Id tag must match bag name.
        // They are both version 4 UUIDs.
        if (this.bagItProfile.isDPNProfile()) {
            this.bagItProfile.setDPNIdTags(this.bagName);
        }
        var bagSizeTag = this.bagItProfile.findTagByName("Bag-Size");
        if (bagSizeTag != null && bagSizeTag.tagFile == "bag-info.txt") {
            bagSizeTag.userValue = "0"; // system will set this
        }
        var baggingDateTag = this.bagItProfile.findTagByName("Bagging-Date");
        if (baggingDateTag != null && baggingDateTag.tagFile == "bag-info.txt") {
            baggingDateTag.userValue = dateFormat(new Date(), "yyyy-mm-dd");
        }
        var tags = this.bagItProfile.tagsGroupedByFile();
        data['tags'] = tags;
        data['cssClassFor'] = {};
        data['messageFor'] = {};
        var fileStatus = this.bagItProfile.tagFileCompletionStatus();
        for (var filename in fileStatus) {
            var allRequiredTagsHaveValues = fileStatus[filename];
            if (allRequiredTagsHaveValues) {
                // Collapsed
                data['cssClassFor'][filename] = 'collapse';
                data['messageFor'][filename] = 'All required tags for this file have been filled in.';
            } else {
                // Visible
                data['cssClassFor'][filename] = 'panel-collapse in';
                if (this.bagItProfile.isCustomTagFile(filename)) {
                    data['messageFor'][filename] = 'Custom tag file. All items are optional.';
                } else {
                    data['messageFor'][filename] = 'Required items are marked with an asterisk. *';
                }
            }
        }
        return data;
    }

    // filesToPackage returns a list of files that should go into
    // a bag.
    filesToPackage() {
        var job = this;
        var filesToPackage = [];
        var shouldIncludeFile = function(filepath) {
            return Job.shouldIncludeFile(filepath, job.options);
        };
        for (var f of this.files) {
            var stats = fs.statSync(f);
            if (stats.isDirectory()) {
                Util.walkSync(f, filesToPackage, shouldIncludeFile);
            } else if(stats.isFile() && shouldIncludeFile(f)) {
                filesToPackage.push({
                    absPath: f,
                    stats: stats
                });
            }
        }
        return filesToPackage;
    }

    static getStore() {
        return db.store;
    }

    findResult(operation, provider) {
        var result = null;
        for (var r of this.operationResults) {
            if (r.operation == operation && r.provider == provider) {
                result = r;
                break;
            }
        }
        return result;
    }

    packagedFileModtime() {
        let modTime = null;
        if (this.packagedFile && fs.existsSync(this.packagedFile)) {
            let stat = fs.statSync(this.packagedFile);
            modTime = stat.mtime;
        }
        return modTime;
    }

    // Run this job
    run() {
        // Bag the files
        // Currently, the 'complete' event that packager.packageFiles() emits
        // when it's finished calls job.uploadFiles(), which is defined below.
        // That's a hack.
        // We should have some kind of controller to handle that event.
        var job = this;
        if (this.packageFormat == "BagIt" && this.bagItProfile != null) {
            var PackagerClass = Plugins.getPackageProviderByFormat('BagIt');
            var provider = null;
            if (PackagerClass != null) {
                provider = new PackagerClass(null, null).describe()['name'];
            }
            var emitter = Plugins.newPackageEmitter(job, provider);
            if (PackagerClass == null) {
                emitter.emit('error', "Cannot find package provider for BagIt format.<br/>");
            } else {
                var packager = new PackagerClass(job, emitter);
                packager.packageFiles();
            }
        }
    }

    uploadFiles() {
        // Send the bag to storage.
        // TODO: Correctly handle multiple uploads in the UI.
        var job = this;
        for (var service of job.storageServices) {
            var StorerClass = Plugins.getStorageProviderByProtocol(service.protocol);
            var provider = null;
            if (StorerClass != null) {
                provider = new StorerClass(null, null).describe()['name'];
            }
            var emitter = Plugins.newStorageEmitter(job, provider);
            if (StorerClass == null) {
                emitter.emit('error', `Cannot find storage provider for ${service.protocol}.<br/>`);
            } else {
                var storer = new StorerClass(service, emitter);
                storer.upload(job.packagedFile);
            }
        }
    }
}

module.exports.Job = Job;
