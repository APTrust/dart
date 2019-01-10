const Controllers = require('./controllers');
const Templates = require('./common/templates');
const { UIHelper } = require('./common/ui_helper');

$(function() {
    let lastHref = '#';
    $(window).on('hashchange', function() {
        // Don't reload after resetting hash or closing modal.
        if (location.hash === '#!' || location.href === lastHref) {
            lastHref = location.hash = '#!';
            return;
        }
        let response = UIHelper.handleRequest(location.href);
        if (response.container) {
            $('#nav').html(response.nav);
            $('#container').html(response.container);
            $('#modal').modal('hide');
            lastHref = location.href;
        } else if (response.modalContent) {
            $('#modalTitle').html(response.modalTitle);
            $('#modalContent').html(response.modalContent);
            $('#modal').modal('show');
        }
        // Clear the hash, so if user re-clicks a button, the
        // app will still respond.
        location.hash = '#!';
    });

    // Route clicks on table rows
    $('#container').on('click', 'table tr.clickable-row', function() {
        location.href = $(this).data('url');
    });

    // Load the inital nav.
    $('#nav').html(Templates.nav({ section: 'Dashboard' }));

    // Modal is fired by an href change. When it closes, we want
    // to reset the href to the underlying page, else clicking to
    // re-open the modal will have no effect.
    $('#modal').on('hidden.bs.modal', function(e) {
        location.href = lastHref;
    });
});
