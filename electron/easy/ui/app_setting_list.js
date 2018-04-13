const { AppSetting } = require('../core/app_setting');
const { AppSettingForm } = require('./app_setting_form');
const BuiltInProfiles = require('../core/builtin_profiles');
const { Choice } = require('../core/choice');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Menu } = require('./menu');
const State = require('../core/state');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

class AppSettingList {

    constructor() {
        // Nothing to do
    }

    initEvents() {
        $("#btnNewAppSetting").off("click");
        $('.clickable-row[data-object-type="AppSetting"]').off("click");

        $("#btnNewAppSetting").on("click", function() { AppSettingList.showForm(null) });
        $('.clickable-row[data-object-type="AppSetting"]').on("click", this.onSettingClick);
    }

    onSettingClick() {
        var id = $(this).data('object-id');
        AppSettingList.showForm(id);
    }

    static showForm(id) {
        var setting = new AppSetting();
        var showDeleteButton = false;
        if (!Util.isEmpty(id)) {
            setting = AppSetting.find(id);
            if (setting.userCanDelete) {
                showDeleteButton = true;
            }
        }
        State.ActiveObject = setting;
        var appSettingForm = new AppSettingForm(setting);
        var data = {};
        data['form'] = appSettingForm.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(Templates.appSettingForm(data));
    }

}

module.exports.AppSettingList = AppSettingList;
