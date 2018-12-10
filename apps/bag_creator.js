const { Bagger } = require('../bagit/bagger');
const { BagItProfile } = require('../bagit/bagit_profile');
const CLI = require('./cli_constants');
const dateFormat = require('dateformat');
const { Job } = require('../core/job');
const { PackagingOperation } = require('../core/packaging_operation');
const path = require('path');
const { TagDefinition } = require('../bagit/tag_definition');
const { Util } = require('../core/util');

// node apps/dart-cli.js --command create-bag --profile test/profiles/aptrust_bagit_profile_2.2.json --source /Users/apd4n/go/src/github.com/APTrust/dart/test/bags/ --output /Users/apd4n/tmp/newbag.tar --tags 'bag-info/Source-Organization: APTrust' --tags 'aptrust-info/Access: Institution' --tags 'aptrust-info/Title: Bag of Goodies'

class BagCreator {

    constructor(opts) {
        this.opts = opts;
        this.exitCode = CLI.EXIT_SUCCESS;
        this.tags = [];
    }

    run() {
        this.validateOpts();
        this.parseTags();

        var job = new Job();
        var bagName = Util.bagNameFromPath(this.opts.output)
        job.packagingOperation = new PackagingOperation(bagName, this.opts.output);
        job.packagingOperation.sourceFiles.push(...this.opts.source);
        job.bagItProfile = BagItProfile.load(this.opts.profile);

        var creator = this;
        var bagger = new Bagger(job);

        bagger.on('error', function(err) {
            this.exitCode = CLI.EXIT_COMPLETED_WITH_ERRORS;
            console.log(err);
        });
        bagger.on('fileAdded', function(bagItFile) {
            console.log(bagItFile.relDestPath);
        });


        var promise = new Promise(function(resolve, reject) {
            bagger.on('finish', function() {
                let result = bagger.job.packagingOperation.result;
                if (result.error != '') {
                    this.exitCode = CLI.EXIT_COMPLETED_WITH_ERRORS;
                    console.log(result.error);
                    resolve(result);
                } else {
                    // TODO: Validate the bag.
                    console.log(`Bag created at ${this.opts.output}`);
                    resolve(result);
                }
            });
        });
        bagger.create();
        return promise;
    }

    validateOpts() {
        if (this.opts.source.length < 1) {
            throw 'Specify at least one source file or directory when creating a bag.'
        }
        if (!this.opts.output) {
            throw 'Specify an output file or directory when creating a bag.'
        }
    }

    parseTags() {
        for (var tagString of this.opts.tags) {
            this.tags.push(TagDefinition.fromCommandLineArg(tagString));
        }
    }

    // TODO: Move to Util & test
    getBagName() {
        var bagName = path.basename(opts.output);
        return bagName.replace(/(\.tar)$|(\.tar\.gz)$|(\.gz)$/, '');
    }

}

module.exports.BagCreator = BagCreator;
