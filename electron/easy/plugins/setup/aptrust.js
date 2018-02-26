// Field is a form field.
const process = require('process');
const Field = require('../../core/field');

const name = "APTrust";
const description = "Provides setup questions for APTrust";
const version = "0.1";

class APTrust {
    constructor() {
        this.fields = this._initFields();
    }

     describe() {
         return { name: name,
                  description: description,
                  version: version,
                };
     }

    _initFields() {
        var domainNamePattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        var macLinuxFilePattern = /(\/\w+)+/;  // This is a little simplistic. Looking for an absolute path.
        var windowsFilePattern = /^(?:[a-z]:|\\\\[a-z0-9_.$-]+\\[a-z0-9_.$-]+)\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*$/;

        var orgName = this._getSetupField('orgName', 'Organization Name');
        orgName.help = "Enter the name of your organization. This name will be written into the Source-Organization field of the bag-info.txt file of each APTrust bag you create. Examples: 'University of Virginia', 'University of Virginia School of Law'.";
        this.fields.push(orgName);

        var domain = this._getSetupField('domain', 'Domain Name');
        domain.help = "Enter your institution's domain name. For example, 'unc.edu', 'virginia.edu'. If you are making deposits for only one part of a larger organization, enter your group's sub-domain. For example, 'med.virginia.edu', 'law.virginia.edu', etc.";
        domain.validator = function(value) {
            if(value && value.match(domainNamePattern)) {
                domain.error = "";
                return true
            }
            domain.error = "Please enter a valid domain name.";
        }
        this.fields.push(domain);

        var pathToBagger = this._getSetupField('pathToBagger', 'Path to Bagger');
        pathToBagger.help = "The EasyStore installation package includes a program called apt_create_bag, which packages your files into BagIt bags. Save that program to a safe place on your computer and enter the location here. For Windows users, the path should end with '.exe'; for Mac and Linux users, it should not. For example: 'c:\Users\josie\Documents\apt_create_bag.exe', '/User/josie/bin/apt_create_bag'."
        pathToBagger.validator = function(value) {
            var pattern = macLinuxFilePattern;
            var suffix = "apt_create_bag";
            var errMsg = "Enter an absolute path that begins with a forward slash and ends with /apt_create_bag";
            if (process.platform == 'windows') {
                pattern = windowsFilePattern;
                suffix = "apt_create_bag.exe"
                errMsg = "Enter an absolute path that ends with \apt_create_bag.exe";
            }
            if (value && value.match(pattern) && value.endsWith(suffix)) {
                pathToBagger.error = "";
                return true;
            }
            pathToBagger.error = errMsg;
            return false;
        }
        this.fields.push(pathToBagger);

        var baggingDir = this._getSetupField('baggingDir', 'Bagging Directory');
        baggingDir.help = "Where should the bagger assemble bags? This should be a directory name. Examples: 'c:\Users\josie\Documents\APTrustBags', '/User/josie/temp'.";
        var baggingDir.validator = function(value) {

        }
        this.fields.push(baggingDir);

        var awsAccessKeyId = this._getSetupField('awsAccessKeyId', 'AWS Access Key ID');
        awsAccessKeyId.help = "Enter your AWS Access Key ID here, if you received one. This is the shorter of the two keys. If you did not receive an AWS access key, contact help@aptrust.org to get one."
        awsAccessKeyId.attrs['required'] = false;
        this.fields.push(awsAccessKeyId);

        var awsSecretAccessKey = this._getSetupField('awsSecretAccessKey', 'AWS Secret Access Key');
        awsSecretAccessKey.help = "Enter your AWS Secret Access Key here, if you received one. This is the longer of the two keys. If you did not receive an AWS access key, contact help@aptrust.org to get one."
        awsSecretAccessKey.attrs['required'] = false;
        this.fields.push(awsSecretAccessKey);

    }

    // _getSetupField is a utility function that returns a Field object for a
    // question on your setup form.
    _getSetupField(name, label) {
        var field = new Field(name, name, label, '');
        field.attrs['required'] = true;
        return field;
    }

}
