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
            $(`#${dartProcess.id} div.packageInfo`).show();
            if (job.packageOp.packageFormat == 'BagIt') {
                $(`#${dartProcess.id} div.validationInfo`).show();
            }
        }
        if (job.uploadOps.length > 0) {
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
        let detailDiv = $(`#${dartProcess.id} div.packageInfo div.detail`);
        let iconDiv = $(`#${dartProcess.id} div.packageInfo div.resultIcon`);
        if (data.action == 'fileAdded') {
            iconDiv.html(UIConstants.SMALL_BLUE_SPINNER);
            detailDiv.text(Context.y18n.__('Added file %s', data.msg));
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, iconDiv, data.msg);
            } else {
                this.markFailed(detailDiv, iconDiv, data.msg);
            }
        } else {
            detailDiv.text(data.msg);
        }
    }

    renderValidationInfo(data, dartProcess) {
        let detailDiv = $(`#${dartProcess.id} div.validationInfo div.detail`);
        let iconDiv = $(`#${dartProcess.id} div.validationInfo div.resultIcon`);
        if (data.action == 'checksum') {
            iconDiv.html(UIConstants.SMALL_BLUE_SPINNER);
            detailDiv.text(Context.y18n.__('Validating %s', data.msg));
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.markSuccess(detailDiv, iconDiv, data.msg);
            } else {
                this.markFailed(detailDiv, iconDiv, data.msg);
            }
        }
    }

    renderUploadInfo(data, dartProcess) {
        let detailDiv = $(`#${dartProcess.id} div.uploadInfo div.detail`);
        let iconDiv = $(`#${dartProcess.id} div.uploadInfo div.resultIcon`);
        if (data.action == 'start') {
            iconDiv.html(UIConstants.SMALL_BLUE_SPINNER);
            detailDiv.text(data.msg);
        } else if (data.action == 'completed') {
            if (data.status == Constants.OP_SUCCEEDED) {
                this.completedUploads.push(data.msg);
                this.markSuccess(detailDiv, iconDiv, this.completedUploads.join("<br/>\n"));
            } else {
                this.markFailed(detailDiv, iconDiv, detailDiv.html());
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
        let detailDiv = $(`#${dartProcess.id} div.outcome div.detail`);
        let iconDiv = $(`#${dartProcess.id} div.outcome div.resultIcon`);
        if (code == 0) {
            this.markSuccess(detailDiv, iconDiv, Context.y18n.__('Job completed successfully.'));
        } else {
            let msg = Context.y18n.__('Job did not complete due to errors.')
            Context.logger.error(msg);
            this.logFailedOps(job);
            msg += `<br/>${job.getRunErrors().join("<br/>")}`
            this.markFailed(detailDiv, iconDiv, msg.replace(/\n/g, '<br/>'));
        }
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

    markSuccess(detailDiv, iconDiv, message) {
        detailDiv.html(message);
        iconDiv.html(UIConstants.GREEN_SMILEY);
    }

    markFailed(detailDiv, iconDiv, message) {
        detailDiv.html(message);
        iconDiv.html(UIConstants.RED_ANGRY_FACE);
    }

}

module.exports.RunningJobsController = RunningJobsController;
