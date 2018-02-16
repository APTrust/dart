
const PAYLOAD_FILE = 'payload';
const PAYLOAD_MANIFEST = 'manifest';
const TAG_MANIFEST = 'tagmanifest';
const TAG_FILE = 'tagfile';

module.exports = class BagItFile {

    constructor(absSourcePath, relDestPath, stats) {
        this.absSourcePath = absSourcePath;
        this.relDestPath = relDestPath;
        this.stats = stats;
        this.fileType = BagItFile.getFileType(relDestPath);
        this.checksums = {};
    }

    static getFileType(relDestPath) {
        if (relDestPath.startsWith('data/')) {
            return PAYLOAD_FILE;
        } else if (relDestPath.startsWith('manifest-')) {
            return PAYLOAD_MANIFEST;
        } else if (relDestPath.startsWith('tagmanifest-')) {
            return TAG_MANIFEST;
        }
        return TAG_FILE;
    }
}
