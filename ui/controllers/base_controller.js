const { Context } = require('../../core/context')
const electron = require('electron');
const Templates = require('../common/templates');
const { Util } = require('../../core/util');

/**
 * BaseController is the base class from which other view controllers
 * derive. This class implements the basic controller actions such as
 * displaying forms and lists, saving user-edited objects, etc.
 *
 * The BaseController and all its subclasses use standard HTTP query
 * params to pass parameters. They also use DART Forms, which parse
 * HTML form data using jQuery.
 *
 * @param {url.URLSearchParams} params - URL parameters from the UI.
 * These usually come from a query string attached to the href attribute
 * of a link or button.
 *
 * @param {string} navSection - The section of DART's top navigation bar
 * that should be highlighted when this controller renders a page. For
 * example, when rendering {@link AppSetting} pages, the "Settings"
 * section of the top nav bar should be active.
 */
class BaseController {

    constructor(params, navSection) {
        /**
         * A {@link url.URLSearchParams} object containing parameters that
         * the controller will need to render the display. For forms, the
         * only required param is usually "id", which is the UUID of the
         * object to be edited. For lists, this typically includes
         * limit, offset, orderBy, and sortDirection.
         *
         * @type {url.URLSearchParams}
         */
        this.params = params;
        /**
         * The typeMap describes how values in this.params should be converted,
         * if they do need to be converted. Because {@link url.URLSearchParams}
         * are always either strings or arrays of strings, we sometimes need
         * to convert them to numbers or booleans before we can use them.
         * For example, a controller that lists a number of objects needs the
         * "limit" param to be converted from string "20" to number 20.
         *
         * The typeMap currently supports types "string", "boolean", and
         * "number" (no dates yet). Each controller sets its own typeMap
         * as necessary.
         *
         * @type {object.<string, string>} Where key is the param name and
         * value is the data type.
         */
        this.typeMap = {};
        /**
         * The name of the nav section to highlight when this controller
         * renders a page. Valid values include any names you see on DART's
         * top nav bar, including "Dashboard", "Settings", "Jobs" and "Help".
         *
         * @type {string}
         */
        this.navSection = navSection;
        /**
         * Controllers may optionally set this before redirecting,
         * to make an alert message appear on the top of the destination
         * page. For example, after successfully submitting a form, a
         * controller typically redirects to the list page with an alert
         * message at the top saying the data  was saved.
         *
         * @type {string}
         */
        this.alertMessage = null;

        /**
         * Controllers may optionally set this before redirecting to control
         * the appearance of the optional alertMessage. The value can be any
         * valid Bootstrap 4 alert class. The most common values will be
         * "alert-success" and "alert-danger".
         *
         * @type {string}
         * @default "alert-success"
         */
        this.alertCssClass = 'alert-success';

        // The following are all set by child classes.
        /**
         * This is the model which the controller represents. For example,
         * The AppSettingController renders forms and lists for the AppSetting
         * model. This must be set by the child class.
         *
         * @type {PersistentObject|object}
         */
        this.model;
        /**
         * This is the name of the form class that can render a form for
         * this controller's model. For example, the AppSettingController
         * will have formClass AppSettingForm. This must be set by the child
         * class.
         *
         * @type {Form}
         */
        this.formClass;
        /**
         * This is the template that renders this controller's form.
         * Templates are properties of the {@link Template} object.
         * This property must be set by the child class.
         *
         * @type {handlebars.Template}
         */
        this.formTemplate;
        /**
         * This is the template that renders this controller's object list.
         * Templates are properties of the {@link Template} object.
         * This property must be set by the child class.
         *
         * @type {handlebars.Template}
         */
        this.listTemplate;
        /**
         * The name property of this template's model. This is used when
         * ordering lists of objects by name. For example, the nameProperty
         * for model {@link BagItProfile} or {@link AppSetting} would be
         * "name".
         *
         * @type {string}
         */
        this.nameProperty;
        /**
         * This property will be set to true if the controller that was
         * originally called redirected to a new controller.
         *
         * @type {boolean}
         * @default false
         */
        this.redirected = false;
    }

    /**
     * Converts URLSearchParams to a simple hash with correct data types.
     * The data types are specified in each controller's typeMap, which
     * can specify that certain params be converted to numbers or booleans.
     *
     */
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

    /**
     * The sets the content of the main page container to the html
     * you pass in.
     *
     * @param {string} html - HTML content to render in the page's
     * main container.
     */
    containerContent(html) {
        return {
            nav: Templates.nav({ section: this.navSection }),
            container: html
        }
    }

    /**
     * This sets the title and body of the modal popup window.
     *
     * @param {string} title - The title of the modal popup.
     *
     * @param {string} body - The HTML content of the modal popup.
     */
    modalContent(title, body) {
        return {
            modalTitle: title,
            modalContent: body
        }
    }

    /**
     * Controller methods call this when they do not want to render
     * any new content.
     */
    noContent() {
        return {};
    }

    /**
     * This opens a URL in an external browser window, using the user's
     * default web browser.
     *
     * The URL comes the value of the "url" param in the params object
     * that was passed in to this object's constructor. Derived classes
     * can also call this.params.set('url', '...value...') before calling
     * this method.
     */
    openExternal() {
        electron.shell.openExternal(this.params.get('url'));
    }

    /**
     * This redirects to a new URL that will call the function fnName
     * on the controller controllerName with the specified params.
     * Use this only when redirecting to an entirely new controller.
     *
     * This changes the page URL, causing the {@link RequestHandler}
     * to parse and route the new request.
     *
     * @example
     * this.redirect('JobFiles', 'show', this.params);
     *
     * @param {string} controllerName - The name of the controller you
     * want to redirect to.
     *
     * @param {string} fnName - The name of the function on the new
     * controller that should process the request.
     *
     * @param {URLSearchParams} params - The URL query parameters to
     * pass into the constructor of the controller you are redirecting to.
     *
     */
    redirect(controllerName, fnName, params) {
        this.redirected = true;
        window.location.href = `#${controllerName}/${fnName}?${params.toString()}`;
        return this.noContent();
    }

    /**
     * This displays a blank form that allows a user to create a new
     * instance of an object.
     */
    new() {
        let form = new this.formClass(new this.model());
        let html = this.formTemplate({ form: form });
        return this.containerContent(html);
    }

    /**
     * This displays a HTML form with pre-filled values, so a user
     * can edit an existing object.
     */
    edit() {
        let obj = this.model.find(this.params.get('id'));
        let form = new this.formClass(obj);
        let html = this.formTemplate({ form: form });
        return this.containerContent(html);
    }

    /**
     * This handles the submission of a form, saving an object to the
     * local database if it's valid, or highlighting errors on the form
     * if the object is not valid.
     */
    update() {
        let obj = this.model.find(this.params.get('id')) || new this.model();
        let form = new this.formClass(obj);
        form.parseFromDOM();
        if (!form.obj.validate()) {
            form.setErrors();
            let html = this.formTemplate({ form: form });
            return this.containerContent(html);
        }
        this.alertMessage = Context.y18n.__(
            "ObjectSaved_message",
            Util.camelToTitle(obj.constructor.name),
            obj[this.nameProperty]);
        obj.save();
        return this.list();
    }

    /**
     * This displays a list of all instances of an object type from the local
     * database. It works with params limit, offset, orderBy, and sortDirection,
     * which are passed into the constructor in the params object.
     */
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

    /**
     * This deletes an object from the database, after prompting the user
     * to confirm they really want to delete it.
     */
    destroy() {
        let obj = this.model.find(this.params.get('id'));
        let confirmDeletionMessage = Context.y18n.__(
            "Confirm_deletion",
            Util.camelToTitle(obj.constructor.name),
            obj[this.nameProperty]);
        if (confirm(confirmDeletionMessage)) {
            this.alertMessage =Context.y18n.__(
                "ObjectDeleted_message",
                Util.camelToTitle(obj.constructor.name),
                obj[this.nameProperty]);
            obj.delete();
            return this.list();
        }
        return this.noContent();
    }

    /**
     * This is to be defined by derived classes as necessary.
     * It does nothing in the base class, but derived classes
     * can use it to attach event handlers to HTML elements
     * that have just been rendered.
     *
     * @param {string} fnName - The name of the function that was
     * called in the original request. The postRenderCallback may
     * include logic to perform different actions based on what
     * the user initially requested. For example, you may want to
     * attach one set of event handlers after rendering
     * Controller.new() and a different set after rendering
     * Controller.update().
     *
     */
    postRenderCallback(fnName) {

    }

}

module.exports.BaseController = BaseController;
