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
    var icon = $(divId + " .glyphicon")
    icon.removeClass("glyphicon-hand-right");
    icon.addClass("glyphicon-thumbs-up");
    div.show();
}

function showFailure(divId, message) {
    var div = $(divId)
    var icon = $(divId + " .glyphicon")
    var parent = div.parent();
    icon.removeClass("glyphicon-hand-right");
    icon.addClass("glyphicon-thumbs-down");
    div.show();
}

function resetThumbs(divId) {
    var div = $(divId)
    var icon = $(divId + " .glyphicon")
    icon.removeClass("glyphicon-thumbs-up");
    icon.removeClass("glyphicon-thumbs-down");
    icon.addClass("glyphicon-hand-right");
    div.show();
}

function showError(divId, message) {
    $(divId).show();
    $(divId).append(message + "<br/>");
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

    emitter.on('start', function(message) {
        showFilesReset();
        result.started = (new Date()).toJSON();
        $("#jobRun").show();
    });

    emitter.on('complete', function(succeeded, message) {
        if (succeeded == true) {
            $("#jobPackageComplete").show();
            $("#jobPackageComplete .message").append(message + "<br/>");
            $("#jobFilesStart").show();
            result.filename = job.packagedFile.trim();
            showFilesSucceeded();
        } else {
            showError("#jobError", message);
            showFilesFailed();
        }
        result.succeeded = succeeded;
        result.completed = (new Date()).toJSON();
        job.save(); // save job with OperationResult

        // Need to find a better place for this...
        job.uploadFiles();
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
            showFilesFailed();
            showError("#jobError", message);
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
            showError("#jobError", message);
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
            showFilesFailed();
        }
        $("#jobValidate .message").append(message + "<br/>");
    });

    emitter.on('warning', function(message) {
        // No UI for this yet
    });

    emitter.on('error', function(message) {
        result.error += err + NEWLINE;
        showError("#jobError", message);
    });

    return emitter;
}

// newPackageEmitter returns an event emitter that allows a storage
// plugin to send events back to the UI. Param job is the job being
// worked on. The emitter will update the job's operation result
// with info about when the work started and ended, whether it was
// successful, etc. Param provider is the name of the plugin that
// will be performing the operation.
//
// TODO: Correctly handle multiple uploads in the UI.
function newStorageEmitter(job, provider) {
    var emitter = new EventEmitter();
    var result = job.findResult("storage", provider);
    if (result == null) {
        result = new OperationResult("storage", provider);
        job.operationResults.push(result);
    }
    result.reset();
    result.attemptNumber += 1;

    emitter.on('start', function(message) {
        showStorageReset();
        result.started = (new Date()).toJSON();
        $("#jobRun").show();
    });

    emitter.on('complete', function(succeeded, message) {
        if (succeeded == true) {
            $("#jobStorageComplete").show();
            $("#jobStorageComplete .message").append(message + "<br/>");
            showSuccess("#jobStorageStart");
        } else {
            showFailure("#jobStorageStart");
            showError("#jobError", message);
        }
        result.succeeded = succeeded;
        result.completed = (new Date()).toJSON();
        job.save(); // save job with OperationResult
    });

    emitter.on('uploadStart', function(message) {
        $("#jobUploadFile .message").html(message + "<br/>");
        $("#jobUploadFile").show();
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
        } else {
            showFailure("#jobUploadComplete");
            showUploadFailed();
        }
    });

    emitter.on('warning', function(message) {
        console.log('Storage warning ' + message);
    });

    emitter.on('error', function(message) {
        result.error += message + NEWLINE;
        showError("#jobError", message);
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
