const $ = require('jquery');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');
const { UIConstants } = require('../common/ui_constants');

/**
 * This controller is never instantiated or called directly.
 * Both the {@link JobRunController} and the {@link DashboardController}
 * inherit from this class, which contains common methods for displaying
 * info about running jobs.
 *
 */
class RunningJobsController extends BaseController {

    constructor(params, navSection) {
        super(params, navSection)
        this.completedUploads = [];
    }

    initRunningJobDisplay(dartProcess) {
        let job = Job.find(dartProcess.jobId);
        this.showDivs(job, dartProcess);
        let controller = this;

        // If user moves from JobRunController to DashboardController
        // (both of which derive from this class), we don't want
        // listeners to be attached twice. Re-adding the listeners
        // causes them to render content in elements on the current
        // page.
        dartProcess.process.removeAllListeners('message');
        dartProcess.process.removeAllListeners('exit');

        dartProcess.process.on('message', (data) => {
            controller.renderChildProcOutput(data, dartProcess);
        });

        dartProcess.process.on('exit', (code, signal) => {
            Context.logger.info(`Process ${dartProcess.process.pid} exited with code ${code}, signal ${signal}`);
            delete Context.childProcesses[dartProcess.id];
            controller.renderOutcome(dartProcess, code);
        });
    }

    showDivs(job, dartProcess) {
        let processDiv = $('#dartProcessContainer');
        let html = Templates.partials['dartProcess']({ item: dartProcess });
        processDiv.html(html);
        if (job.packageOp && job.packageOp.outputPath) {
            this.initProgressBar(dartProcess, 'packageInfo');
            $(`#${dartProcess.id} div.packageInfo`).show();
            if (job.packageOp.packageFormat == 'BagIt') {
                this.initProgressBar(dartProcess, 'validationInfo');
                $(`#${dartProcess.id} div.validationInfo`).show();
            }
        }
        if (job.uploadOps.length > 0) {
            this.initProgressBar(dartProcess, 'uploadInfo');
            $(`#${dartProcess.id} div.uploadInfo`).show();
        }
        processDiv.show();
    }

    renderChildProcOutput(data, dartProcess) {
        switch (data.op) {
        case 'package':
            this.renderPackageInfo(data, dartProcess);
            break;
        case 'validate':
            this.renderValidationInfo(data, dartProcess);
            break;
        case 'upload':
            this.renderUploadInfo(data, dartProcess);
            break;
        default:
            return;
        }
    }

    renderPackageInfo(data, dartProcess) {
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'packageInfo');
        if (data.action == 'fileAdded') {
            detailDiv.text(Context.y18n.__('Added file %s', data.msg));
            console.log(data.percentComplete);
            progressBar.attr("aria-valuenow", data.percentComplete);
            progressBar.css("width", data.percentComplete + '%');
        } else if (data.action == 'completed') {
            progressBar.removeClass("progress-bar-striped progress-bar-animated");
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, data.msg);
            } else {
                this.markFailed(detailDiv, data.msg);
            }
        } else {
            detailDiv.text(data.msg);
        }
    }

    renderValidationInfo(data, dartProcess) {
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'validationInfo');
        if (data.action == 'checksum') {
            detailDiv.text(Context.y18n.__('Validating %s', data.msg));
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, data.msg);
            } else {
                this.markFailed(detailDiv, data.msg);
            }
        }
    }

    renderUploadInfo(data, dartProcess) {
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'uploadInfo');
        if (data.action == 'start') {
            detailDiv.text(data.msg);
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.completedUploads.push(data.msg);
                this.markSuccess(detailDiv, this.completedUploads.join("<br/>\n"));
            } else {
                this.markFailed(detailDiv, detailDiv.html());
            }
        }
    }

    // TODO: This has a problem. If we're doing a series of uploads and one
    // fails and it's not the LAST one, this reports a successful outcome.
    // It should report an error.
    renderOutcome(dartProcess, code) {
        // We have to reload this, because the child process updated
        // the job's record in the database.
        let job = Job.find(dartProcess.jobId);
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'outcome');
        if (code == 0) {
            this.markSuccess(detailDiv, Context.y18n.__('Job completed successfully.'));
        } else {
            let msg = Context.y18n.__('Job did not complete due to errors.')
            Context.logger.error(msg);
            this.logFailedOps(job);
            msg += `<br/>${job.getRunErrors().join("<br/>")}`
            this.markFailed(detailDiv, msg.replace(/\n/g, '<br/>'));
        }
    }

    getDivs(dartProcess, section) {
        let selectorPrefix = `#${dartProcess.id} div.${section} div.detail`;
        let detailDiv = $(`${selectorPrefix} div.message`);
        let progressBar = $(`${selectorPrefix} div.progress-bar`);
        return [detailDiv, progressBar];
    }

    logFailedOps(job) {
        if (job.packageOp) {
            Context.logger.error(JSON.stringify(job.packageOp));
        }
        if (job.validationOp) {
            Context.logger.error(JSON.stringify(job.validationOp));
        }
        if (job.uploadOps && job.uploadOps.length > 0) {
            Context.logger.error(JSON.stringify(job.uploadOps));
        }
    }

    initProgressBar(dartProcess, section) {
        let [_, progressBar] = this.getDivs(dartProcess, section);
        if (progressBar) {
            let initialClasses = ["progress-bar-striped", "progress-bar-animated"];
            for (let cssClass of initialClasses) {
                if (progressBar.hasClass(cssClass)) {
                    progressBar.addClass(cssClass);
                }
            }
        }
    }

    markSuccess(detailDiv, message) {
        detailDiv.html(message);
    }

    markFailed(detailDiv, message) {
        detailDiv.html(message);
    }

}

module.exports.RunningJobsController = RunningJobsController;
