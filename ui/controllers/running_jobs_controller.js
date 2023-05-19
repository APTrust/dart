const $ = require('jquery');
const { BaseController } = require('./base_controller');
const { Constants } = require('../../core/constants');
const { Context } = require('../../core/context');
const { Job } = require('../../core/job');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

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
        // Clear this on each init
        this.completedUploads = [];
        let job = Job.find(dartProcess.jobId);

        $('#bag-deleted-message').hide()
        this.showDivs(job, dartProcess);
        if ($('#output-path-link').length) {
            $('#output-path-link').removeClass('local-file')
        }
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

        // If we're in the Jobs section, this is the job_run_controller
        // and we need to add some HTML to the page to display job status
        // because the user has just clicked "Run Job".
        //
        // Otherwise, we're in the dashboard, and the HTML we need was
        // already rendered when the page loaded.
        if (this.navSection == 'Jobs') {
            let html = Templates.partials['dartProcess']({ item: dartProcess });
            processDiv.html(html);
        }
        if (job.packageOp && job.packageOp.outputPath) {
            if (!job.skipPackaging) {
                this.initProgressBar(dartProcess, 'packageInfo');
                $(`#${dartProcess.id} div.packageInfo`).show();
            }
            if (job.packageOp.packageFormat == 'BagIt' && !job.skipValidation) {
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
            let shortName = Util.trimToLength(data.msg, 80, 'middle');
            detailDiv.text(Context.y18n.__('Added file %s', shortName));
            this.setProgressBar(progressBar, data);
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, progressBar, data.msg);
                if ($('#output-path-link').length) {
                    $('#output-path-link').addClass('local-file')
                }
            } else {
                this.markFailed(detailDiv, progressBar, data.msg);
            }
        } else {
            detailDiv.text(data.msg);
        }
    }

    renderValidationInfo(data, dartProcess) {
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'validationInfo');
        if (data.action == 'checksum') {
            let shortName = Util.trimToLength(data.msg, 80, 'middle');
            detailDiv.text(Context.y18n.__('Validating %s', shortName));
            this.setProgressBar(progressBar, data);
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, progressBar, data.msg);
            } else {
                this.markFailed(detailDiv, progressBar, data.msg);
            }
        }
    }

    renderUploadInfo(data, dartProcess) {
        let [detailDiv, progressBar] = this.getDivs(dartProcess, 'uploadInfo');
        if (data.action == 'start') {
            detailDiv.text(data.msg);
            // We can have multiple uploads, so we re-initialize the
            // progress bar each time we get a start event.
            this.initProgressBar(dartProcess, 'uploadInfo');
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.completedUploads.push(data.msg);
                this.markSuccess(detailDiv, progressBar, this.completedUploads.join("<br/>\n"));
            } else {
                this.markFailed(detailDiv, progressBar, data.msg);
            }
        } else if (data.action == 'status'){
            detailDiv.text(data.msg);
            this.setProgressBar(progressBar, data);
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
            if (job.packageOp) {
                this.ensureValidationMarkedComplete(dartProcess)
            }
            this.markSuccess(detailDiv, progressBar, Context.y18n.__('Job completed successfully.'));
            if (job.deleteBagAfterUpload && job.bagWasDeletedAfterUpload) {
                $('#bag-deleted-message').show()
            }
        } else {
            let msg = Context.y18n.__('Job did not complete due to errors.')
            Context.logger.error(msg);
            this.logFailedOps(job);
            msg += `<br/>${job.getRunErrors().join("<br/>")}`
            this.markFailed(detailDiv, progressBar, msg.replace(/\n/g, '<br/>'));
        }
        // Button exists on job "Review and Run" page, not dashboard.
        if($('#btnRunJob').length) {
            $('#btnRunJob').prop('disabled', false);
        }
    }

    ensureValidationMarkedComplete(dartProcess) {
        // For some bags with thousands of files, validation isn't
        // marked complete after validation succeeds. This happens
        // occasionally, not consistently. Race condition between
        // process exit and event firing?
        this.renderValidationInfo({action: 'completed', status: Constants.OP_SUCCEEDED, msg: Context.y18n.__('Bag is valid')}, dartProcess);
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
            progressBar.removeClass("bg-success");
            progressBar.removeClass("bg-danger");
            let initialClasses = ["progress-bar-striped", "progress-bar-animated"];
            for (let cssClass of initialClasses) {
                if (progressBar.hasClass(cssClass)) {
                    progressBar.addClass(cssClass);
                }
            }
        }
    }

    setProgressBar(progressBar, data) {
        // Sometimes the data object does not include percentComplete,
        // and when percentComplete is unknown, it's set to -1.
        if (isNaN(data.percentComplete) || data.percentComplete < 0) {
            return;
        }
        // In bag creation, progress bar hits 100% when all payload
        // files are added. We have to add tag files and manifests
        // afterward, and we don't want the bar to bounce, so no
        // changes after it reaches 100%.
        //
        // Similarly with validation, the bar hits 100% when all checksums
        // have been verified, but the validator still has a few remaining
        // tasks, including tag file validation.
        //
        // In both cases, the bar will stick at 100% for a second or two.
        // When all items are complete, the bar animation will stop and
        // the bar will turn green.
        if (parseInt(progressBar.attr("aria-valuenow"), 10) != 100) {
            progressBar.attr("aria-valuenow", data.percentComplete);
            progressBar.css("width", data.percentComplete + '%');
        }
    }

    markSuccess(detailDiv, progressBar, message) {
        detailDiv.html(message);
        if (progressBar) {
            this.setProgressBar(progressBar, { percentComplete: 100 });
            progressBar.removeClass("progress-bar-striped progress-bar-animated");
            progressBar.addClass("bg-success");
        }
    }

    markFailed(detailDiv, progressBar, message) {
        detailDiv.html(message);
        if (progressBar) {
            progressBar.removeClass("progress-bar-striped progress-bar-animated");
            progressBar.attr("aria-valuenow", 100);
            progressBar.css("width", '100%');
            progressBar.addClass("bg-danger");
        }
    }

}

module.exports.RunningJobsController = RunningJobsController;
