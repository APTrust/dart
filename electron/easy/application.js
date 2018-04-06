$(function() {
    const es = require('./easy/easy_store');

    es.Migrations.runAll();

    // Wire up the main menu events
    es.UI.Menu.initEvents();

    // Show the dashboard on startup.
    es.UI.Menu.dashboardShow();
    es.log.info("DART started");

    // This is for interactive testing in the console.
    window.es = es;
});
