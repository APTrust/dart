const EventEmitter = require('events');
const NEWLINE = require('os').EOL;
const requireDir = require('require-dir');
const path = require('path');
const fs = require('fs');
const log = require('../core/log');
const { OperationResult } = require('../core/operation_result');
const PackageProviders = requireDir("./packaging");
const SetupProviders = requireDir("./setup");
const StorageProviders = requireDir("./storage");

// Returns a list of StorageProvider protocols.
// For example, ["s3", "ftp", "rsync"]
function listStorageProviders() {
    var protocols = [];
    for(var moduleName in StorageProviders) {
        var provider = StorageProviders[moduleName];
        protocols.push(provider.protocol);
    }
    protocols.sort();
    return protocols;
}

// Returns a list of PackageProvider formats. E.g.
// [bagit, tar, zip, ...]
function listPackageProviders() {
    var formats = [];
    for(var moduleName in PackageProviders) {
        var provider = PackageProviders[moduleName];
        formats.push(provider.format)
    }
    formats.sort();
    return formats;
}

// Returns a list of SetupProviders
function listSetupProviders() {
    var providers = [];
    for(var moduleName in SetupProviders) {
        var provider = SetupProviders[moduleName];
        providers.push(provider.name)
    }
    providers.sort();
    return providers;
}

// Returns the setup provider with the specified name
function getSetupProviderByName(name) {
    var providers = [];
    for(var moduleName in SetupProviders) {
        var provider = SetupProviders[moduleName];
        if (provider.name == name) {
            return provider;
        }
    }
    return null;
}

// Returns the storage provider that supports the specified
// protocol. Protocol can be 's3', 'ftp', etc.
function getStorageProviderByProtocol(protocol) {
    for(var moduleName in StorageProviders) {
        var module = StorageProviders[moduleName];
        if (module.protocol == protocol) {
            return module.Provider;
        }
    }
    return null;
}

// Returns the package provider that supports the specified
// format. Format can be 'tar', 'bagit', 'bzip', etc.
function getPackageProviderByFormat(format) {
    for(var moduleName in PackageProviders) {
        var module = PackageProviders[moduleName];
        if (module.format == format) {
            return module.Provider;
        }
    }
    return null;
}

// Returns the package provider that supports the specified
// mime-type. Param mimetype is something like 'application/x-zip',
// etc. There is no mime type for bagit, so use
// getPackageProviderByFormat for the bagit format.
function getPackageProviderByMimeType(mimetype) {
    for(var moduleName in PackageProviders) {
        var module = PackageProviders[moduleName];
        if (module.formatMimeType == mimetype) {
            return module.Provider;
        }
    }
    return null;
}

// TODO: Move all this into a separate UI class.

function showStorageReset() {
    var div = $("#jobStorageStart");
    div.removeClass("alert-success");
    div.removeClass("alert-danger");
    div.addClass("alert-info");
    resetThumbs("#jobUploadFile");
    resetThumbs("#jobStorageComplete");
    $("#jobUploadFile .message").html("");
    $("#jobStorageComplete .message").html("");
    div.show();
}

function showFilesReset() {
    var div = $("#jobFilesStart");
    div.removeClass("alert-success");
    div.removeClass("alert-danger");
    div.addClass("alert-info");
    resetThumbs("#jobRunFiles");
    resetThumbs("#jobPackage");
    resetThumbs("#jobValidate");
    resetThumbs("#jobPackageComplete");
    $("#jobRunFiles .message").html("");
    $("#jobPackage .message").html("");
    $("#jobValidate .message").html("");
    $("#jobPackageComplete .message").html("");
    $("#jobError .message").html("");
    $("#jobError").hide();
}

function showFilesSucceeded() {
    var div = $("#jobFilesStart");
    div.removeClass("alert-info");
    div.removeClass("alert-danger");
    div.addClass("alert-success");
}

function showFilesFailed() {
    var div = $("#jobFilesStart");
    div.removeClass("alert-info");
    div.removeClass("alert-success");
    div.addClass("alert-danger");
}

function showUploadSucceeded() {
    var div = $("#jobStorageStart");
    div.removeClass("alert-info");
    div.removeClass("alert-danger");
    div.addClass("alert-success");
}

function showUploadFailed() {
    var div = $("#jobStorageStart");
    div.removeClass("alert-info");
    div.removeClass("alert-success");
    div.addClass("alert-danger");
}

function showSuccess(divId, message) {
    var div = $(divId)
    var icon = $(divId + " .status")
    icon.removeClass("fa fa-spinner fa-spin");
    icon.removeClass("glyphicon glyphicon-hand-right");
    icon.addClass("glyphicon glyphicon-ok");
    div.show();
}

function showFailure(divId, message) {
    var div = $(divId)
    var icon = $(divId + " .status")
    var parent = div.parent();
    icon.removeClass("fa fa-spinner fa-spin");
    icon.removeClass("glyphicon glyphicon-hand-right");
    icon.addClass("glyphicon glyphicon-remove");
    div.show();
}

function resetThumbs(divId) {
    var div = $(divId)
    var icon = $(divId + " .status")
    icon.removeClass("glyphicon glyphicon-ok");
    icon.removeClass("glyphicon glyphicon-remove");
    icon.addClass("fa fa-spinner fa-spin");
    if (divId == '#jobPackage') {
        div.show();
    } else {
        div.hide();
    }
}

function showError(divId, message) {
    $("#jobRun").show();
    $(divId + " .message").append(message + "<br/>");
    $(divId).show();
}


// See https://nodejs.org/api/events.html

// newPackageEmitter returns an event emitter that allows a package
// plugin to send events back to the UI. Param job is the job being
// worked on. The emitter will update the job's operation result
// with info about when the work started and ended, whether it was
// successful, etc. Param provider is the name of the plugin that
// will be performing the operation.
function newPackageEmitter(job, provider) {
    var emitter = new EventEmitter();
    var result = job.findResult("package", provider);
    if (result == null) {
        result = new OperationResult("package", provider);
        job.operationResults.push(result);
    }
    result.reset();
    result.attemptNumber += 1;
    result.note = `Packaged by ${provider}`;

    emitter.on('start', function(message) {
        showFilesReset();
        result.started = (new Date()).toJSON();
        log.info(`Packaging bag ${job.bagName}`);
        $("#jobRun").show();
    });

    emitter.on('complete', function(succeeded, message) {
        if (succeeded == true) {
            $("#jobPackage").hide();
            result.filename = job.packagedFile.trim();
            showFilesSucceeded();
            log.info(`Finished packaging bag ${job.bagName}`);
        } else {
            showError("#jobError", message);
            log.error(`Error packaging ${job.bagName}: ${message}`);
            showFilesFailed();
        }
        result.succeeded = succeeded;
        result.completed = (new Date()).toJSON();
        try {
            // TODO: Make this work for unserialized bags,
            // where we're working with a directory instead
            // of a tar, gzip, or zip file.
            var stats = fs.statSync(job.packagedFile)
            result.filesize = stats["size"];
        } catch(ex) {
            var msg = `Cannot get file size for ${job.packagedFile}`;
            log.error(msg);
            log.error(ex);
            showError("#jobError", ex)
        }
        job.save(); // save job with OperationResult

        // Need to find a better place for this...
        job.uploadFiles();
    });

    emitter.on('fileAddStart', function(message) {
        $("#jobRunFiles").show();
        $("#jobRunFiles .message").html(message);
        log.debug(`fileAddStart ${message}`);
    });

    emitter.on('fileProgress', function(intPercentComplete) {
        // No UI for this yet.
    });

    emitter.on('fileAddComplete', function(succeeded, message) {
        if (succeeded == true) {
            showSuccess("#jobRunFiles");
            log.debug(`fileAddComplete ${message}`);
        } else {
            showFailure("#jobRunFiles");
            showFilesFailed();
            showError("#jobError", message);
            log.error(`fileAddComplete ${message}`);
        }
        $("#jobRunFiles .message").html(message);
    });

    emitter.on('packageStart', function(message) {
        $("#jobPackage").show()
        $("#jobPackage .message").html(message);
        log.debug(`packageStart ${message}`);
    });

    emitter.on('packageComplete', function(succeeded, message) {
        $("#jobRunFiles").hide();
        $("#jobPackageComplete .message").html(message);
        if (succeeded == true) {
            showSuccess("#jobPackageComplete");
            log.debug(`packageComplete ${message}`);
        } else {
            showError("#jobPackageComplete");
            showError("#jobError", message);
            log.error(`packageComplete ${message}`);
        }
        $("#jobPackage .message").html(message);
    });

    emitter.on('validateStart', function(message) {
        $("#jobValidate").show();
        $("#jobValidate .message").html(message);
        log.info(`validateStart ${message}`);
    });

    emitter.on('validateComplete', function(succeeded, message) {
        $("#jobPackage").hide();
        if (succeeded == true) {
            showSuccess("#jobValidate");
            log.info(`validateComplete ${message}`);
        } else {
            showFailure("#jobValidate");
            showFilesFailed();
            log.error(`validateComplete ${message}`);
        }
        $("#jobValidate .message").html(message);
    });

    emitter.on('warning', function(message) {
        // No UI for this yet
        log.warn(message);
    });

    emitter.on('error', function(message) {
        result.error += message + NEWLINE;
        result.succeeded = false;
        result.completed = (new Date()).toJSON();
        job.save();
        showError("#jobError", message);
        log.error(`Error during packaging/validation: ${message}`);
    });

    return emitter;
}

// newStorageEmitter returns an event emitter that allows a storage
// plugin to send events back to the UI. Param job is the job being
// worked on. The emitter will update the job's operation result
// with info about when the work started and ended, whether it was
// successful, etc. Param provider is the name of the plugin that
// will be performing the operation.
//
// TODO: Correctly handle multiple uploads here and in the UI.
function newStorageEmitter(job, provider) {
    var emitter = new EventEmitter();
    var result = job.findResult("storage", provider);
    if (result == null) {
        result = new OperationResult("storage", provider);
        job.operationResults.push(result);
    }
    result.reset();
    result.attemptNumber += 1;

    var serviceName = '?';
    if (job && job.storageServices && job.storageServices[0]) {
        serviceName = job.storageServices[0].name;
    }
    result.note = `Upload to ${serviceName}`;

    emitter.on('start', function(message) {
        showStorageReset();
        result.started = (new Date()).toJSON();
        $("#jobRun").show();
        log.info(`Starting ${result.note}`);
    });

    emitter.on('complete', function(succeeded, message) {
        // TODO: Too much code in here. Refactor.
        if (succeeded == true) {
            try {
                // TODO: Make this work for unserialized bags,
                // where we're working with a directory instead
                // of a tar, gzip, or zip file.
                result.filename = job.packagedFile;
                var stats = fs.statSync(job.packagedFile)
                result.filesize = stats["size"];
            } catch(ex) {
                log.error(`Cannot get file size for ${job.packagedFile}`);
                log.error(ex);
                showError("#jobError", ex)
            }
            $("#jobStorageComplete").show();
            $("#jobStorageComplete .message").append(message + "<br/><br/>");
            if (job.packagedFile != '' &&
                job.packagedFile.startsWith(job.baggingDirectory) &&
                job.packagedFile != job.baggingDirectory) {
                if (fs.statSync(job.packagedFile).isFile()) {
                    var msg = `Deleted ${job.packagedFile} after successful upload`;
                    try {
                        fs.unlinkSync(job.packagedFile);
                    } catch (ex) {
                        msg = `Could not delete packaged file ${job.packagedFile}: ${ex}`;
                        msg += `<br/>Please delete the file manually.`
                    }
                    log.info(msg);
                    $("#jobStorageComplete .message").append(msg + "<br/>");
                }
            }
            showSuccess("#jobStorageStart");
            log.info(`Completed ${result.note}`);
        } else {
            showFailure("#jobStorageStart");
            showError("#jobError", message);
            log.info(`Error ${result.note}: ${message}`);
        }
        result.succeeded = succeeded;
        result.completed = (new Date()).toJSON();
        job.save(); // save job with OperationResult
    });

    emitter.on('uploadStart', function(message) {
        $("#jobUploadFile .message").html(message + "<br/>");
        $("#jobUploadFile").show();
        log.info(`Starting upload ${message}`);
    });

    emitter.on('uploadProgress', function(intPercentComplete) {
        console.log('Upload progress ' + message);
    });

    emitter.on('uploadComplete', function(succeeded, message) {
        $("#jobUploadFile .message").html(message + "<br/>");
        $("#jobUploadFile").show();
        if (succeeded) {
            showSuccess("#jobUploadComplete");
            showUploadSucceeded();
            log.info(`Upload complete. ${message}`);
        } else {
            showFailure("#jobUploadComplete");
            showUploadFailed();
            log.error(`Error uploading: ${message}`);
        }
    });

    emitter.on('warning', function(message) {
        $("#jobUploadFile .message").html(message + "<br/>");
        $("#jobUploadFile").show();
        log.warn(message);
    });

    emitter.on('error', function(message) {
        result.error += message + NEWLINE;
        result.succeeded = false;
        result.completed = (new Date()).toJSON();
        job.save();
        showError("#jobError", message);
        log.error(`Error during upload: ${message}`);
    });
    return emitter;
}


module.exports.listSetupProviders = listSetupProviders;
module.exports.listStorageProviders = listStorageProviders;
module.exports.listPackageProviders = listPackageProviders;
module.exports.getSetupProviderByName = getSetupProviderByName;
module.exports.getStorageProviderByProtocol = getStorageProviderByProtocol;
module.exports.getPackageProviderByFormat = getPackageProviderByFormat;
module.exports.getPackageProviderByMimeType = getPackageProviderByMimeType;
module.exports.newPackageEmitter = newPackageEmitter;
module.exports.newStorageEmitter = newStorageEmitter;
