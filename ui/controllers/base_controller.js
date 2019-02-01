const { Context } = require('../../core/context')
const electron = require('electron');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

class BaseController {

    constructor(params, navSection) {
        this.params = params;
        this.typeMap = {};
        this.navSection = navSection;
        this.alertMessage = null;

        // The following are all set by child classes.
        this.model;
        this.form;
        this.formTemplate;
        this.listTemplate;
        this.nameProperty;
    }

    // Converts URLSearchParams to a simple hash with correct data types.
    paramsToHash() {
        let data = {};
        for(let [key, value] of this.params.entries()) {
            let toType = this.typeMap[key] || 'string';
            if (toType === 'string') {
                data[key] = value;
            } else {
                data[key] = Util.cast(value, toType);
            }
        }
        return data;
    }

    containerContent(html) {
        return {
            nav: Templates.nav({ section: this.navSection }),
            container: html
        }
    }

    modalContent(title, body) {
        return {
            modalTitle: title,
            modalContent: body
        }
    }

    noContent() {
        return {};
    }

    openExternal() {
        console.log(this.params);
        electron.shell.openExternal(this.params.get('url'));
    }

    new() {
        let form = this.form.create(new this.model());
        let html = this.formTemplate({ form: form });
        return this.containerContent(html);
    }

    edit() {
        let obj = this.model.find(this.params.get('id'));
        let form = this.form.create(obj);
        let html = this.formTemplate({ form: form });
        return this.containerContent(html);
    }

    update() {
        let obj = this.model.find(this.params.get('id')) || new this.model();
        let form = this.form.create(obj);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = this.formTemplate({ form: form });
            return this.containerContent(html);
        }
        this.alertMessage = Context.y18n.__(
            "ObjectSaved_message",
            Util.camelToTitle(obj.type),
            obj[this.nameProperty]);
        obj.save();
        return this.list();
    }

    list() {
        let listParams = this.paramsToHash();
        listParams.orderBy = listParams.sortBy || this.defaultOrderBy;
        listParams.sortDirection = listParams.sortOrder || this.defaultSortDirection;
        let items = this.model.list(null, listParams);
        let data = {
            alertMessage: this.alertMessage,
            items: items
        };
        let html = this.listTemplate(data);
        return this.containerContent(html);
    }

    destroy() {
        let obj = this.model.find(this.params.get('id'));
        let confirmDeletionMessage = Context.y18n.__(
            "Confirm_deletion",
            Util.camelToTitle(obj.type),
            obj[this.nameProperty]);
        if (confirm(confirmDeletionMessage)) {
            this.alertMessage =Context.y18n.__(
                "ObjectDeleted_message",
                Util.camelToTitle(obj.type),
                obj[this.nameProperty]);
            obj.delete();
            return this.list();
        }
        return this.noContent();
    }

}

module.exports.BaseController = BaseController;
