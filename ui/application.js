const { UI } = require('./common/ui.js');

$(function() {
    $(window).on('hashchange', function() {
        alert(UI.parseLocation(window.location.href));
    });
    if(!window.location.hash) {
        window.location.hash = '#';
    }
    $('#nav').html(UI.renderNav('Dashboard'));
});
