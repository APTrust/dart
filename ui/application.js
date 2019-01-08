const Controllers = require('./controllers');
const Templates = require('./common/templates');
const { UIHelper } = require('./common/ui_helper');

$(function() {
    $(window).on('hashchange', function() {
        let response = UIHelper.handleRequest(window.location.href);
        if (response.container) {
            $('#nav').html(response.nav);
            $('#container').html(response.container);
            $('#modal').modal('hide');
        } else if (response.modalContent) {
            $('#modalTitle').html(response.modalTitle);
            $('#modalContent').html(response.modalContent);
            $('#modal').modal('show');
        }
    });
    if(!window.location.hash) {
        window.location.hash = '#';
    }
    $('#nav').html(Templates.nav({ section: 'Dashboard' }));
});
