const { AppSetting } = require('./app_setting');
const { BagItProfile } = require('../bagit/bagit_profile');
const { Context } = require('./context');
const { RemoteRepository } = require('./remote_repository');
const { StorageService } = require('./storage_service');

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
        this.prompt = opts.prompt || "";
        this.objType = opts.objType || "";
        this.objId = opts.objId || "";
        this.field = opts.field || "";
    }

    /**
     * This copies the user's response to a field of some existing
     * setting ({@link AppSetting}, {@link BagItProfile},
     * {@link RemoteRepository} or {@link StorageService}) and saves
     * the updated setting.
     *
     */
    copyResponseToObject(response) {
        let classToSet = AppSetting
        switch (this.objType) {
        case Context.y18n.__("App Setting"):
            classToSet = AppSetting;
            break;
        case Context.y18n.__("BagIt Profile"):
            classToSet = BagItProfile;
            break;
        case Context.y18n.__("Remote Repository"):
            classToSet = RemoteRepository;
            break;
        case Context.y18n.__("Storage Service"):
            classToSet = StorageService;
            break;
        default:
            throw Context.y18n.__("Response must be assigned to an object");
        }
        let obj = classToSet.find(this.objId);
        if (obj == null) {
            throw Context.y18n.__("Cannot find %s", classToSet.name);
        }
        if (this.objType == Context.y18n.__("BagIt Profile")) {
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
}

module.exports.ExportQuestion = ExportQuestion;
