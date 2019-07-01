// Import DART into the window's global namespace.
// This is our only global. Add the UI package as well,
// since we're running in the GUI context here.
const DART = require('../dart');
DART.UI = require('../ui');

// Now set everything up when the page loads.
$(function() {
    // Run all migrations so that the user's enviromnent is
    // up to date.
    DART.Migrations.runAll();

    // Connect navigation to controller callbacks.
    let lastHref = '#';
    $(window).on('hashchange', function() {
        // Don't reload after resetting hash or closing modal.
        if (location.hash === '#!' || location.href === lastHref) {
            lastHref = location.hash = '#!';
            return;
        }

        // Handle the request. Update lastHref only if the request
        // was NOT to display a modal, since modal requests do not
        // change the underlying page.
        let handler = new DART.UI.Common.RequestHandler(location.href);
        let controllerRedirected = handler.handleRequest();
        if (!controllerRedirected) {
            if (!handler.isModalRequest) {
                lastHref = location.href;
            }

            // Clear the hash, so if user re-clicks a button, the
            // app will still respond.
            location.hash = '#!';
        }
    });

    // Route clicks on table rows
    $('#container').on('click', 'table tr.clickable-row', function() {
        location.href = $(this).data('url');
    });

    // Route clicks on table cells
    $('#container').on('click', 'table tr td.clickable-cell', function(e) {
        location.href = $(this).data('url');
        e.stopPropagation();
    });

    // Load the inital nav.
    $('#nav').html(DART.UI.Common.Templates.nav({ section: 'Dashboard' }));

    // Modal is fired by an href change. When it closes, we want
    // to reset the href to the underlying page, else clicking to
    // re-open the modal will have no effect.
    $('#modal').on('hidden.bs.modal', function(e) {
        location.href = lastHref;
    });

    // Fixes Bootstrap bug #17371: Items in dropdown get stuck in 'active' mode.
    // https://github.com/twbs/bootstrap/issues/17371
    $('#container').on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
        if (e.relatedTarget) {
            // relatedTarget is the previously active tab,
            // which should now be deactivated.
            $(e.relatedTarget).removeClass('active');
        }
    });

    // Attach popover help tips to dynamically added elements
    var popOverSettings = {
        container: 'body',
        trigger: 'hover',
        html: true,
        selector: '[data-toggle="popover"]',
        content: function () {
            return $('#popover-content').html();
        }
    }
    $('body').popover(popOverSettings);


    function showRunningJobsBadge() {
        let runningJobCount = Object.values(DART.Core.Context.childProcesses).length;
        let badge = $('#runningJobsBadge');
        let msg = runningJobCount == 1 ? "Running Jobs" : "Running Jobs";
        if (runningJobCount > 0) {
            $('#runningJobsBadge a').text(DART.Core.Context.y18n.__(`%s ${msg}`, runningJobCount));
            badge.show();
        } else {
            badge.hide();
        }
    }

    // Show the running jobs badge immediate, then refresh every 3 seconds.
    showRunningJobsBadge();
    let runningJobsInterval = setInterval(showRunningJobsBadge, 3000);

    // Show the dashboard
    location.hash = '#Dashboard/show';
});
