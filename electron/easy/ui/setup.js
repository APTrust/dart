const Templates = require('../core/templates');

// setup.js includes functions to display and manage the walk-through
// setup process defined in any of the setup plugins.
module.exports = class Setup {
    // Param provider is a setup plugin, from the easy/plugins/setup directory.
    constructor(provider) {
        this.provider = new provider.Provider();
        this.currentQuestion = 0;
    }

    // Starts the setup process by presenting the initial message or the
    // first setup question.
    start() {
        var setup = this;
        $('#setupContent').html(setup.provider.startMessage());
        $('#btnPrevious').hide();
        $('#btnNext').show();
        $('#btnNext').click(function() {
            setup.installSettings();
        });
    }

    installSettings() {
        var setup = this;
        var header = '<h3>Installing Base Settings</h3>';
        var appSettingsMsg = `<p>${setup.provider.installAppSettings()}</p>`;
        var profilesMsg = `<p>${setup.provider.installBagItProfiles()}</p>`;
        var servicesMsg = `<p>${setup.provider.installStorageServices()}</p>`;
        $('#setupContent').html(header + appSettingsMsg + profilesMsg + servicesMsg);
        $('#btnPrevious').show();
        $('#btnPrevious').click(function() {
            setup.start()
        });
        $('#btnNext').show();
        $('#btnNext').click(function() {
            setup.next();
        });
    }

    // Shows the next panel in the setup process.
    next() {
        var setup = this;
        var question = this.provider.fields[this.currentQuestion];
        var data = {};
        data['question'] = question;
        if ($('#' + question.id).length) {
            // Current question is showing. Validate it.
            if (typeof question.validator == 'function') {
                if (question.validator()) {
                    this.currentQuestion += 1;
                    this.next();
                    return
                } else {
                    // This re-renders the div with the error message.
                    $('#setupContent').html(Templates.setupQuestion(data));
                    return;
                }
            }
        } else {
            // Current question is not showing. Show it.
            $('#setupContent').html(Templates.setupQuestion(data));
        }
        $('[data-toggle="popover"]').popover();
        $('#btnPrevious').show();
        $('#btnPrevious').click(function() {
            setup.previous()
        });
        $('#btnNext').show();
        $('#btnNext').click(function() {
            setup.next();
        });
    }

    // Shows the previous panel in the setup process.
    previous() {

        $('[data-toggle="popover"]').popover();
        this.currentQuestion -= 1;
    }

    // Shows the end-of-setup page
    end() {

    }

}
