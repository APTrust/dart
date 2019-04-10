const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const { DartProcess } = require('../../core/dart_process');
const Templates = require('../common/templates');

/**
 * The DartProcessController displays information about the DART child
 * processes used to package, validate, and/or upload files.
 *
 * @param {URLSearchParams} params - The URL search params parsed
 * from the URL used to reach this page. This should contain at
 * least the DartProcess Id.
 *
 * @param {string} params.id - The id of the DartProcess to display.
 * DartProcess.id is a UUID string.
 */
class DartProcessController extends BaseController {

    constructor(params) {
        super(params, 'Jobs');
        this.model = DartProcess;
        this.listTemplate = Templates.dartProcessList;
        this.nameProperty = 'name';
        this.defaultOrderBy = 'startedAt';
        this.defaultSortDirection = 'desc';
        this.dartProcess = DartProcess.find(this.params.get('id'));
    }

    /**
     * Displays a summary of the process.
     */
    list() {
        let data = {
            items: this.getRunningProcesses()
        };
        return this.containerContent(Templates.dartProcessList(data));
    }

    getRunningProcesses() {
        let idsOfRunningProcs = Object.keys(Context.childProcesses);
        let opts = {
            orderBy: this.defaultOrderBy,
            sortDirection: this.defaultSortDirection
        };
        let filterFn = (obj) => { idsOfRunningProcs.includes(obj.id) };
        return DartProcess.list(filterFn, opts);
    }

}

module.exports.DartProcessController = DartProcessController;
