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
        var appSettingsMsg = `<p>${setup.provider.installAppSettings()}</p>`;
        var profilesMsg = `<p>${setup.provider.installBagItProfiles()}</p>`;
        var servicesMsg = `<p>${setup.provider.installStorageServices()}</p>`;
        $('#setupContent').html(appSettingsMsg + profilesMsg + servicesMsg);
        $('#btnPrevious').show();
        $('#btnPrevious').click(function() {
            setup.start()
        });
        $('#btnNext').show();
        $('#btnNext').click(function() {
            setup.next
        });
    }

    // Shows the next panel in the setup process.
    next() {

    }

    // Shows the previous panel in the setup process.
    previous() {

    }

    // Shows the end-of-setup page
    end() {

    }

}
