const { Plugin } = require('../plugin');

/**
 * This is the base class for repository plugins, which must provide
 * their own implementation of the methods described below. Repository
 * plugins provide methods of querying remote repositories, for example,
 * to list recently ingested objects. The query methods should return
 * HTML to be displayed in the DART dashboard.
 *
 * @param {RemoteRepository} remoteRepository - A configuration object
 * that includes information about how to connect to the remote repository's
 * REST API.
 *
 */
class RepositoryBase extends Plugin {
    constructor(remoteRepository) {
        super();
        this.repo = remoteRepository;
    }

    /**
     * This returns a list of objects describing what reports this
     * module provides. The DART dashboard queries this list to see
     * what method calls this plugin makes available. Each object in
     * the list this function returns has three properties.
     *
     * title - This is the title of the report. The dashboard will
     * display this title as is at the top of the report.
     *
     * description - A description of the report.
     *
     * method - A function to call to get the contents of the report.
     * The function takes no parameters and should a promis that
     * ultimately returns HTML. The dashboard will display the HTML
     * when the promise is resolved.
     *
     * Subclasses MUST override this method and must not call super().
     *
     * @type {Array<object>}
     */
    provides() {
        throw new Error('This method must be implemented in the subclass.');
    }

    /**
     * This returns true if the RemoteRepository object has enough info to
     * attempt a connection. Most repos required a url, userId, and/or apiToken.
     *
     * Subclasses MUST override this method and must not call super().
     *
     * @returns {boolean}
     */
    hasRequiredConnectionInfo() {
        throw new Error('This method must be implemented in the subclass.');
    }
}

module.exports.RepositoryBase = RepositoryBase;
