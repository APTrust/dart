const EventEmitter = require('events');
const NEWLINE = require('os').EOL;
const requireDir = require('require-dir');
const path = require('path');

const OperationResult = require(path.resolve('electron/easy/core/operation_result'));
const PackageProviders = requireDir(path.resolve("electron/easy/plugins/packaging"));
const StorageProviders = requireDir(path.resolve("electron/easy/plugins/storage"));

// Returns a list of StorageProvider protocols.
// For example, ["s3", "ftp", "rsync"]
function listStorageProviders() {
    var protocols = [];
    for(var moduleName in StorageProviders) {
        var provider = StorageProviders[moduleName];
        protocols.push(provider.protocol);
    }
    return protocols;
}

// Returns a map of PackageProviders in which the keys
// are file formats and values are mimetypes. For example:
//
// {
//   'tar': 'application/x-tar',
//   'zip': 'application/zip',
//   'bagit': ''
// }
//
// Note that there is no mimetype for bagit.
function listPackageProviders() {
    var formats = {};
    for(var moduleName in PackageProviders) {
        var provider = PackageProviders[moduleName];
        formats[provider.format] = provider.formatMimeType;
    }
    return formats;
}

// Returns the storage provider that supports the specified
// protocol. Protocol can be 's3', 'ftp', etc.
function getStorageProviderByProtocol(protocol) {
    for(var moduleName in StorageProviders) {
        var provider = StorageProviders[moduleName];
        if (provider.protocol == protocol) {
            return provider;
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

// See https://nodejs.org/api/events.html

// newPackageEmitter returns an event emitter that allows a package
// plugin to send events back to the UI. Param job is the job being
// worked on. The emitter will update the job's operation result
// with info about when the work started and ended, whether it was
// successful, etc.
function newPackageEmitter(job, provider) {
    var emitter = new EventEmitter();
    var result = job.findResult("package", provider);
    if (result == null) {
        result = new OperationResult("package", provider);
        job.operationResults.push(result);
    }
    result.reset();
    result.attemptNumber += 1;

    emitter.on('start', function(message) {
        result.started = (new Date()).toJSON();
        $("#jobRun").show();
    });

    emitter.on('complete', function(succeeded, message) {
        if (succeeded == true) {
            $("#jobPackageComplete").show();
            $("#jobPackageComplete .message").append(message + "<br/>");
            result.filename = job.packagedFile;
        } else {
            showError(message);
        }
        result.succeeded = succeeded;
        result.completed = (new Date()).toJSON();
        job.save(); // save job with OperationResult
    });

    emitter.on('fileAddStart', function(message) {
        $("#jobRunFiles").show();
        $("#jobRunFiles .message").html(message);
    });

    emitter.on('fileProgress', function(intPercentComplete) {
        // No UI for this yet.
    });

    emitter.on('fileAddComplete', function(succeeded, message) {
        if (succeeded == true) {
            showSuccess("#jobRunFiles");
        } else {
            showFailure("#jobRunFiles");
            showError(message);
        }
        $("#jobRunFiles .message").html(message);
    });

    emitter.on('packageStart', function(message) {
        $("#jobPackage").show()
        $("#jobPackage .message").html(message);
    });

    emitter.on('packageComplete', function(succeeded, message) {
        if (succeeded == true) {
            showSuccess("#jobPackage");
        } else {
            showSuccess("#jobPackage");
            showError(message);
        }
        $("#jobPackage .message").html(message);
    });

    emitter.on('validateStart', function(message) {
        $("#jobValidate").show();
        $("#jobValidate .message").html(message);
    });

    emitter.on('validateComplete', function(succeeded, message) {
        if (succeeded == true) {
            showSuccess("#jobValidate");
        } else {
            showFailure("#jobValidate");
        }
        $("#jobValidate .message").append(message + "<br/>");
    });

    emitter.on('warning', function(message) {
        // No UI for this yet
    });

    emitter.on('error', function(message) {
        result.error += err + NEWLINE;
        showError(message);
    });

    function showSuccess(divId, message) {
        var div = $(divId)
        var icon = $(divId + " .glyphicon")
        div.removeClass("alert-info");
        div.addClass("alert-success");
        icon.removeClass("glyphicon-hand-right");
        icon.addClass("glyphicon-thumbs-up");
        div.show();
    }

    function showFailure(divId, message) {
        var div = $(divId)
        var icon = $(divId + " .glyphicon")
        div.removeClass("alert-info");
        div.removeClass("alert-success");
        div.addClass("alert-danger");
        icon.removeClass("glyphicon-hand-right");
        icon.addClass("glyphicon-thumbs-down");
        div.show();
    }

    function showError(message) {
        $("#jobError").show();
        $("#jobError").append(message + "<br/>");
    }

    return emitter;
}

// newPackageEmitter returns an event emitter that allows a storage
// plugin to send events back to the UI.
function newStorageEmitter() {
    emitter.on('start', function(message) {

    });
    emitter.on('complete', function(succeeded, message) {

    });
    emitter.on('uploadStart', function(message) {

    });
    emitter.on('uploadProgress', function(intPercentComplete) {

    });
    emitter.on('uploadComplete', function(succeeded, message) {

    });
    emitter.on('warning', function(message) {

    });
    emitter.on('error', function(message) {

    });
    return emitter;
}


module.exports.listStorageProviders = listStorageProviders;
module.exports.listPackageProviders = listPackageProviders;
module.exports.getStorageProviderByProtocol = getStorageProviderByProtocol;
module.exports.getPackageProviderByFormat = getPackageProviderByFormat;
module.exports.getPackageProviderByMimeType = getPackageProviderByMimeType;
module.exports.newPackageEmitter = newPackageEmitter;
module.exports.newStorageEmitter = newStorageEmitter;
