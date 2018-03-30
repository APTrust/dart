const { AppSetting } = require('../core/app_setting');
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
        $("#btnNewAppSetting").on("click", function() { AppSettingList.showForm(null) });
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
        var data = {};
        data['form'] = setting.toForm();
        data['showDeleteButton'] = showDeleteButton;
        $("#container").html(Templates.appSettingForm(data));
    }

}

module.exports.AppSettingList = AppSettingList;
