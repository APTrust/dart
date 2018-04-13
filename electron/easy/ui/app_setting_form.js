const { AppSetting } = require('../core/app_setting');
const { Field } = require('../core/field');
const { Form } = require('../core/form');
const { Menu } = require('./menu');
const State = require('../core/state');
const Templates = require('../core/templates');
const { Util } = require('../core/util');

class AppSettingForm {

    constructor(setting) {
        this.setting = setting || new AppSetting();
    }

    initEvents() {
        $("#btnApplicationSettingSave").off("click");
        $("#btnApplicationSettingDelete").off("click");

        $("#btnApplicationSettingSave").on("click", this.onSave());
        $("#btnApplicationSettingDelete").on("click", this.onDelete());
    }

    onSave() {
        var self = this;
        return function() {
            self.setting = self.fromForm();
            var result = self.setting.validate();
            if (result.isValid()) {
                self.setting.save();
                return Menu.appSettingShowList(`Setting ${self.setting.name} has been saved`);
            } else {
                var form = self.toForm();
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

    toForm() {
        var form = new Form('appSettingForm');
        form.fields['id'] = new Field('appSettingId', 'id', 'id', this.setting.id);
        form.fields['name'] = new Field('appSettingName', 'name', 'Name', this.setting.name);
        form.fields['userCanDelete'] = new Field('userCanDelete', 'userCanDelete', 'User Can Delete', this.setting.userCanDelete);
        if (!this.setting.userCanDelete) {
            form.fields['name'].attrs['disabled'] = true;
        }
        if (this.setting.help) {
            form.fields['name'].help = this.help;
        }
        form.fields['value'] = new Field('appSettingValue', 'value', 'Value', this.setting.value);
        return form
    }

    fromForm() {
        var name = $('#appSettingName').val().trim();
        var value = $('#appSettingValue').val().trim();
        var userCanDelete = $('#userCanDelete').val().trim();
        var setting = new AppSetting(name, value);
        setting.id = $('#appSettingId').val().trim();
        setting.userCanDelete = Util.boolValue(userCanDelete);
        return setting
    }


}

module.exports.AppSettingForm = AppSettingForm;
