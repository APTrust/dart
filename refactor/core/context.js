const { Config } = require('./config')


/**
 * GlobalContext is a single, globally available object that provides
 * information and services to all components of the application.
 */
class GlobalContext {
    constructor() {
        // When you run `npm test`, this env var is set by jest.
        this.isTestEnv = process.NODE_ENV === 'test';
        this.config = this.isTestEnv ? Config.test : Config.user;
        this.dataStores = {};
    }
    function db(name) {
        // Return the JsonStore with the specified name (class name),
        // creating it first if necessary. Track all stores in this.dataStores.
    }
}

const Context = GlobalContext();
Object.freeze(Context);

export default Context;
