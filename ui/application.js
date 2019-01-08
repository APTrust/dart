const Controllers = require('./controllers');
const Templates = require('./common/templates');
const { UIHelper } = require('./common/ui_helper');

$(function() {
    $(window).on('hashchange', function() {
        // Response may include data to be rendered in #container,
        // #nav, #modalTitle, #modalContent
        let response = UIHelper.handleRequest(window.location.href);
        if (typeof response === 'string') {
            $('#container').html(response);
        } else {
            for (let elementId of Object.keys(response)) {
                $(elementId).html(response[elementId]);
            };
        }
    });
    if(!window.location.hash) {
        window.location.hash = '#';
    }
    $('#nav').html(Templates.nav({ section: 'Dashboard' }));
});
