const { AppSetting } = require('../core/app_setting');
const { Menu } = require('./menu');
const State = require('../core/state');
const Templates = require('../core/templates');

class AppSettingForm {

    constructor(setting) {
        this.setting = setting || new AppSetting();
    }

    initEvents() {
        $("#btnApplicationSettingSave").on("click", this.onSave());
        $("#btnApplicationSettingDelete").on("click", this.onDelete());
    }

    onSave() {
        var self = this;
        return function() {
            self.setting = AppSetting.fromForm();
            var result = self.setting.validate();
            if (result.isValid()) {
                self.setting.save();
                return Menu.appSettingShowList(`Setting ${self.setting.name} has been saved`);
            } else {
                var form = setting.toForm();
                form.setErrors(result.errors);
                var data = {};
                data['form'] = form;
                data['showDeleteButton'] = AppSetting.find(self.setting.id) != null && self.setting.userCanDelete;
                $("#container").html(Templates.appSettingForm(data));
            }
            // Do we still need this?
            State.ActiveObject = self.setting;
        }
    }

    onDelete() {
        var self = this;
        return function() {
            if (!confirm("Delete this setting?")) {
                return;
            }
            self.setting.delete();
            Menu.appSettingShowList(`Deleted setting ${self.setting.name}`);
        }
    }

}

module.exports.AppSettingForm = AppSettingForm;
