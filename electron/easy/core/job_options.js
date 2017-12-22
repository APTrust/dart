module.exports = class JobOptions {
    constructor() {
        this.skipDSStore = true;
        this.skipHiddenFiles = false;
        this.skipDotKeep = false;
    }
    objectType() {
        return 'JobOptions';
    }
}
