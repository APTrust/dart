// setup.js includes functions to display and manage the walk-through
// setup process defined in any of the setup plugins.

class Setup {
    // Param provider is a setup plugin, from the easy/plugins/setup directory.
    constructor(provider) {
        this.provider = provider;
        this.currentQuestion = 0;
    }

    // Starts the setup process by presenting the initial message or the
    // first setup question.
    start() {
        var setup = this;
        $('#setupContent').html(provider.startMessage());
        $('#btnPrevious').hide();
        $('#btnNext').show();
        $('#btnNext').click(setup.installSettings);
    }

    installSettings() {
        var setup = this;
        var appSettingsMsg = `<p>${provider.installAppSettings()}</p>`;
        var profilesMsg = `<p>${provider.installBagItProfiles()}</p>`;
        var servicesMsg = `<p>${provider.installStorageServices()}</p>`;
        $('#setupContent').html(appSettingsMsg + profilesMsg + servicesMsg);
        $('#btnPrevious').show();
        $('#btnPrevious').click(setup.start);
        $('#btnNext').show();
        $('#btnNext').click(setup.next);
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
