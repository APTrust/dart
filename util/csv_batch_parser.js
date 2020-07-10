const fs = require('fs')
const { JobParams } = require('../core/job_params');
const parse = require('csv-parse/lib/sync')

/**
 * CSVBatchParser parses CSV files describing a batch of jobs that should
 * all go through the same workflow. You can typically set this up as an
 * Excel or Google spreadsheet exported to CSV. The spreadsheet should have
 * the column names in the first row. It MUST have the following columns:
 *
 * * Bag-Name - the name of the bag to create. E.g. 'MyBag' or
 * 'BagOfPhotos.tar'
 *
 * * Root-Directory - the absolute path the folder you want to bag up.
 * Note that batch jobs don't support adding multiple folders to a bag.
 *
 * In addition, the CSV file should contain tag settings for each entry.
 * The column header for each tag entry should be in the format
 * "file-name.txt/Tag-Name", for example, "bag-info.txt/Source-Organization"
 * or "aptrust-info.txt/Access". If the tag file name (everything up to the
 * slash) is missing from any column header, the parser will set the
 * tag file to "bag-info.txt".
 *
 * You can add any arbitrary tag names to the column headers. The parser
 * will pass them all into the bag's tag files, regardless of whether or
 * or not your BagIt profile recognizes. Remember that BagIt profiles may
 * define which tags must be present, but they do not exclude additional
 * custom tags.
 *
 * Note that the parser reads the whole CSV file into memory at once.
 * If your file has a few hundred or even a few thousand entries, that
 * should be OK. If your file has too many entries, you may run out of
 * memory.
 *
 * You can run the jobs in the batch synchronously or in parallel. You
 * generally won't want to run more than a few jobs concurrently, because
 * the bagging process requires a lot of disk I/O. Running 2-4 jobs at once
 * may be sane. Running 100 will lead to disk thrashing.
 *
 * The code in the example below runs one job at a time from the CSV file.
 *
 * @example
 *
 * const {CSVBatchParser} = require('./util/csv_batch_parser');
 *
 * let parser = new CSVBatchParser({
 *     pathToFile: 'home/joe/batch_job.csv',
 *     workflowName: 'APTrust Demo Glacier-OH',
 * });
 *
 * try {
 *    let jobParamsArray = parser.parseAll();
 *    jobParamsArray.forEach(function(params) {
 *      let exitCode = runJob(params);
 *      if (exitCode == Constants.EXIT_SUCCESS) {
 *        // Good times :)
 *      } else {
 *        // Very stable genius :(
 *      }
 *    }
 * }
 * catch (ex) {
 *    // Handle exception. Usually file doesn't exist, is not readable,
 *    // or is not parsable.
 * }
 *
 * async function runJob(jobParams) {
 *    let job = jobParams.toJob();
 *    if (job == null) {
 *      throw "Invalid Job"
 *    }
 *    let jobRunner = new JobRunner(job);
 *    let exitCode = await jobRunner.run();
 *    return exitCode;
 * }
 *
 * @param {string} opts.pathToFile - The path to the CSV file you want to
 * parse.
 * @param {string} opts.workflowName - The name of the workflow through which
 * you want to run all the bags.
 */
class CSVBatchParser {

    constructor(opts) {
        this.pathToFile = opts.pathToFile;
        this.workflowName = opts.workflowName;
    }

    /**
     * This returns an array of JobParams objects with each object
     * representing one line in the CSV file. This will throw an exception
     * if the CSV file doesn't exist or is not readable.
     *
     * This method does not verify that the JobParams objects are valid.
     * The caller should ensure that each object has a workflowName,
     * a packageName, one or more files, and the appropriate tags.
     *
     * @returns {Array<JobParams>}
     */
    parseAll() {
        let parser = this;
        let jobParamsArray = [];
        let entries = this._parse();
        for (let entry of entries) {
            jobParamsArray.push(
                new JobParams({
                    workflowName: this.workflowName,
                    packageName: entry['Bag-Name'],
                    files: [entry['Root-Directory']],
                    tags: parser._parseTags(entry),
                }));
        }
        return jobParamsArray
    }

    /**
     * Parse CSV data from this.pathToFile. Throws exception if file
     * does not exist or cannot be parsed.
     */
    _parse() {
        let parserOptions = {
            bom: true,      // detect byte order marker from Excel exports
            columns: true,  // column names in first row
            skip_empty_lines: true
        };
        let csvData = fs.readFileSync(this.pathToFile);
        return parse(csvData, parserOptions);
    }


    /**
     * This returns a list of tags from the given entry object (which comes
     * from one parsed line of the CSV file). Note that even the reserved
     * names "Bag-Name" and "Root-Directory" are interpreted as tags (because
     * it can't hurt to have that extra metadata).
     *
     * Tag names in the column headers of the CSV file should be in the format
     * file-name.txt/Tag-Name. Any tag names that omit the filename component
     * before the slash will be set to the default file name "bag-info.txt".
     *
     * @returns {Array<object>}
     */
    _parseTags(entry) {
        let tags = [];
        for (let [key, value] of Object.entries(entry)) {
            let parts = key.split('/', 2);
            if (parts.length == 1) {
                // No tag file specified. Assume bag-info.txt.
                let tagName = parts[0];
                parts[0] = 'bag-info.txt';
                parts.push(tagName);
            }
            tags.push({
                tagFile: parts[0],
                tagName: parts[1],
                userValue: value,
            });
        }
        return tags;
    }
}

module.exports.CSVBatchParser = CSVBatchParser;
