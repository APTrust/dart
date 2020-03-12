const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { RemoteRepository } = require('./remote_repository');
const { StorageService } = require('./storage_service');
const { Util } = require('./util');

const ListNames = {
    'AppSetting': 'appSettings',
    'BagItProfile': 'bagItProfiles',
    'RemoteRepository': 'remoteRepositories',
    'StorageService': 'storageServices',
}

/**
* ExportQuestion is a question added to {@link ExportSettings}.
* Whoever imports the settings answers the question, and DART copies
* their response to the appropriate object.
*/
class ExportQuestion {
    /**
     * Creates a new ExportQuestion
     *
     * @param {object} opts - Object containing properties to set.
     *
     * @param {string} opts.prompt - The text of the question.
     *
     * @param {string} opts.objType - The type of object to which DART
     * should copy the user's response. (Localized versions of
     * "App Setting", "BagIt Profile", "Remote Repository" or
     * "Storage Service").
     *
     * @param {string} opts.objId - The id of the object to which DART
     * should copy the response.
     *
     * @param {string} opts.field - The name of the field to which DART
     * should copy the response.
     *
     */
    constructor(opts = {}) {
        this.id = opts.id || Util.uuid4();
        this.prompt = opts.prompt || "";
        this.objType = opts.objType || "";
        this.objId = opts.objId || "";
        this.field = opts.field || "";
    }

    /**
     * Returns the list name (property name) for the specified type.
     * For example, listNameFor('AppSetting') returns 'appSettings',
     * which is the name of the property on this object that lists
     * AppSettings selected for export.
     *
     * @returns {string}
     */
    static listNameFor(typeName) {
        return ListNames[typeName];
    }

    /**
     * This copies the user's response to a field of some existing
     * setting ({@link AppSetting}, {@link BagItProfile},
     * {@link RemoteRepository} or {@link StorageService}) and saves
     * the updated setting.
     *
     */
    copyResponseToObject(response) {
        let classToSet = this.getTargetClass();
        if (classToSet == null) {
            throw Context.y18n.__("Response must be assigned to an object");
        }
        let obj = classToSet.find(this.objId);
        if (obj == null) {
            throw Context.y18n.__("Cannot find %s", classToSet.name);
        }
        if (this.objType == "BagItProfile") {
            let tagDef = obj.firstMatchingTag("id", this.field);
            if (tagDef == null) {
                throw Context.y18n.__("BagIt Profile '%s' has no field with id %s", obj.name, this.field);
            }
            tagDef.defaultValue = response;
        } else {
            obj[this.field] = response;
        }
        obj.save();
    }

    /**
     * Try to get the existing value for the object/field this question
     * refers to, so we can pre-populate the answer.
     *
     * @returns {string}
     */
    tryToGetValue() {
        let classToGet = this.getTargetClass();
        if (classToGet == null) {
            return "";
        }
        let obj = classToGet.find(this.objId);
        if (obj == null) {
            return "";
        }
        if (this.objType == "BagItProfile") {
            let tagDef = obj.firstMatchingTag("id", this.field);
            if (tagDef == null) {
                return "";
            }
            return tagDef.getValue();
        }
        return obj[this.field] || "";
    }

    /**
     * Returns the class to which this question pertains. The returned
     * class will be one of {@link AppSetting}, {@link BagItProfile},
     * {@link RemoteRepository}, {@link StorageService} or null. If null,
     * something is wrong with the question.
     *
     */
    getTargetClass() {
        let targetClass = null
        switch (this.objType) {
        case "AppSetting":
            targetClass = AppSetting;
            break;
        case "BagItProfile":
            targetClass = BagItProfile;
            break;
        case "RemoteRepository":
            targetClass = RemoteRepository;
            break;
        case "StorageService":
            targetClass = StorageService;
            break;
        }
        return targetClass;
    }
}

module.exports.ExportQuestion = ExportQuestion;
