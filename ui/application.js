const Controllers = require('./controllers');
const Templates = require('./common/templates');
const { UIHelper } = require('./common/ui_helper');

$(function() {
    let lastHref = '#';
    $(window).on('hashchange', function() {
        // Don't reload after closing modal.
        if (window.location.href === lastHref) {
            return;
        }
        let response = UIHelper.handleRequest(window.location.href);
        if (response.container) {
            $('#nav').html(response.nav);
            $('#container').html(response.container);
            $('#modal').modal('hide');
            lastHref = window.location.href;
        } else if (response.modalContent) {
            $('#modalTitle').html(response.modalTitle);
            $('#modalContent').html(response.modalContent);
            $('#modal').modal('show');
        }
    });

    // Route clicks on table rows
    $('#container').on('click', 'table tr.clickable-row', function() {
        window.location.href = $(this).data('url');
    });

    // Load the inital nav.
    $('#nav').html(Templates.nav({ section: 'Dashboard' }));

    // Modal is fired by an href change. When it closes, we want
    // to reset the href to the underlying page, else clicking to
    // re-open the modal will have no effect.
    $('#modal').on('hidden.bs.modal', function(e) {
        window.location.href = lastHref;
    });
});
