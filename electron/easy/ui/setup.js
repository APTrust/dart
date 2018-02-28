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
        $('#btnNext').on('click', function() {
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
        $('#btnPrevious').on('click', function() {
            setup.start()
        });
        $('#btnNext').show();
        $('#btnNext').on('click', function() {
            setup.next();
        });
    }

    // Shows the next panel in the setup process.
    next() {
        var setup = this;
        var question = this.provider.fields[this.currentQuestion];
        if (this.isShowing(question)) {
            if (this.validateAnswer(question)) {
                this.currentQuestion += 1;
                if (this.currentQuestion == this.provider.fields.length) {
                    this.end();
                    return;
                }
                question = this.provider.fields[this.currentQuestion];
            }
        }
        this.showQuestion(question);
        this.setQuestionPreviousNextButtons();
    }

    // Shows the previous panel in the setup process.
    previous() {
        this.currentQuestion -= 1;
        var question = this.provider.fields[this.currentQuestion];
        this.showQuestion(question);
        this.setQuestionPreviousNextButtons();
    }

    // Shows the setupComplete message.
    end() {
        $('#setupContent').html(setup.provider.endMessage());
        $('#btnNext').hide();
    }

    showQuestion(question) {
        var data = {};
        data['question'] = question;
        $('#setupContent').html(Templates.setupQuestion(data));
        $('[data-toggle="popover"]').popover();
    }

    validateAnswer(question) {
        // Current question is showing. Validate it.
        // Note that the validator is also responsible for doing
        // something with the valid answer, like saving it as
        // an AppSetting. That's up to the setup plugin.
        if (this.hasValidator(question)) {
            var input = this.getControl(question);
            return question.validator(input.val())
        }
        return true; // no validator, so any answer is OK
    }

    isShowing(question) {
        return $('#' + question.id).length > 0;
    }

    hasValidator(question) {
        return (typeof question.validator == 'function');
    }

    getControl(question) {
        return $('#' + question.id).first();
    }

    setQuestionPreviousNextButtons() {
        $('#btnPrevious').show();
        $('#btnPrevious').off('click');
        if (setup.currentQuestion == 0) {
            $('#btnPrevious').on('click', function() {
                setup.installSettings()
            });
        } else {
            $('#btnPrevious').on('click', function() {
                setup.previous()
            });
        }

        $('#btnNext').show();
        $('#btnNext').off('click');
        if (setup.currentQuestion == setup.provider.fields.length) {
            $('#btnNext').on('click', function() {
                setup.end();
            });
        } else {
            $('#btnNext').on('click', function() {
                setup.next();
            });
        }
    }

}
