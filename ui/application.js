const Controllers = require('./controllers');
const Templates = require('./common/templates');
const { UIHelper } = require('./common/ui_helper');

$(function() {
    $(window).on('hashchange', function() {
        $('#container').html(UIHelper.handleRequest(window.location.href));
    });
    if(!window.location.hash) {
        window.location.hash = '#';
    }
    $('#nav').html(Templates.nav({ section: 'Dashboard' }));
});
