# DART Release Notes

## Pending for 2.0.20 - June 10, 2022

* Fixed BagIt-Profile-Info for [BTR profile](https://github.com/dpscollaborative/btr_bagit_profile/blob/master/btr-bagit-profile.json). (Migration 20220429T182345Z.js)
* Default bagging directory is no longer hidden in ~/home/.dart. A new migration sets the bagging directory to ~/Documents/DART, unless user has previously changed this setting on their own. Fixes [Make default bagging directory not hidden?](https://github.com/APTrust/dart/issues/520)
* Fixed [File extension in output path does not update in Packaging window when changing serialisation](https://github.com/APTrust/dart/issues/519)
* Stopped showing unsupported output formats (zip, gzip, rar, 7z) in list of job packaging format options. We'll re-add these when we support the formats.
* Temporarily disabled tar as a standalone output format (though tarred bags are still supported). This feature is not fully implemented. We'll return it as an option when it's ready. This is a temporary fix to [.tar packaging producing no output](https://github.com/APTrust/dart/issues/513)


## 2.0.19 - April 14, 2022

* Fixed [broken translation/localization](https://github.com/APTrust/dart/issues/516)
* Updated async library to fix [security bug](https://nvd.nist.gov/vuln/detail/CVE-2021-43138)

## 2.0.18 - March 30, 2022

* Fixed [Bagit Profile Export issue with cancelling adding questions](https://github.com/APTrust/dart/issues/514)
* Fixed [security issue](https://github.com/APTrust/dart/security/dependabot/8), bumping plist from 3.0.4 to 3.0.5
* Fixed [security issue](https://github.com/APTrust/dart/security/dependabot/5), bumping minimist from 1.2.5 to 1.2.6
* Bumped ssh2-sftp-client from 7.1.0 to 7.2.3.
* Updated some build dependencies that don't make into the distributable package (electron-build and xcode version).

## 2.0.17 - November 5, 2021

This release contains a number of security fixes, but no new features.

* Upgraded Electron from 11.4.10 to 11.5.0 to fix [thumbnail vulnerability](https://github.com/advisories/GHSA-mpjm-v997-c4h4).
* Upgraded ssh2 from 0.8.9 to 1.5.0 to mitigate [CVE-2020-26301 - OS command injection](https://github.com/advisories/GHSA-652h-xwhf-q4h6).

The remaining [ansi-regex](https://github.com/advisories/GHSA-93q8-gq69-wqmw)
and [set-value](https://github.com/advisories/GHSA-4jqc-8m5r-9rpr) affect
libraries used only in development and testing. These libraries are not
included in the DART distribution.

## 2.0.16 - October 27, 2021

* Fixed [Issue 504: Unable to use command line with job params on Windows](https://github.com/APTrust/dart/issues/504)

## 2.0.15 - October 21, 2021

* Fixed a bug that caused empty StorageService.port to be serialized
as an empty string instead of zero. This was not a problem for DART,
but it was for DART runner, which expects an integer.

## 2.0.14 - October 14, 2021

* Added Workflow Export feature to work with [DART runner](https://github.com/APTrust/dart-runner).

## 2.0.13 - September 1, 2021

* This release includes security updates but no new features.
* Upgraded path-parse library to v1.0.7 to fix CVE-2021-23343.
* Upgraded csv-parse to v4.16.2.
* Fixed Apple code signing and notarization to stop "unknown author" warnings on Mac OS.
* Added [BSD license](LICENSE).

## 2.0.12 - August 9, 2021

* Fixed [Dart not accepting files](https://github.com/APTrust/dart/issues/476) in [commit eb75c3f](https://github.com/APTrust/dart/commit/eb75c3f0c044f93ea56016a6b5c5f769a647729c).

## 2.0.11 - December 7, 2020

* Fixed a typo in the "files to package" screen.
* Removed list of allowed values in the bag-info.txt/Bagging-Software tag.
  That had caused some user-defined custom BagIt Profiles to generate bags
  that would not validate.
* Extended timeout on a few async tests that sporadically timed out.


## 2.0.10 - October 15, 2020

* Export BagIt Profiles to match version 1.3.0 of the [BagIt Profile Specification](https://bagit-profiles.github.io/bagit-profiles-specification/)
* Fixed regressions: Electron 10+ broke the Help > About and Help > Logs popup
  windows.

## 2.0.9 - July 24, 2020

* Added Batch Jobs - Run a workflow batch to create and ship hundreds of bags at once.
  See the documentation at <https://aptrust.github.io/dart-docs/users/workflows/batch_jobs/>

## 2.0.8 - May 26, 2020

* Fixed [Unserialized bags which match existing path are invalid](https://github.com/APTrust/dart/issues/280)
* Updated to Electron 9.0.0
* Updated several npm dependencies

## 2.0.7 - May 14, 2020

* Settings import question now displays a password field instead of a regular text input for passwords.
* (Internal) Added `npm run bump` to simplify version changes.

## 2.0.6 - May 12, 2020

* Exported BagIt profiles now include Manifests-Allowed and Tag-Maifests-Allowed
* Settings export no long fails on missing BagIt profiles.
* Progress bars on Job Run page no longer bounce when a bag contains long file names.
* Validation progress bar on Job Run page is marked complete when job succeeds.
* Security updates to underlying npm libraries

## 2.0.5 - April 7, 2020

* Fixed [Bag-Size not written to bag-info.txt](https://github.com/APTrust/dart/issues/247)
* Security updates for a number npm dependencies

## 2.0.4 - March 12, 2020

* Added validation-only jobs for users who simply want to validate an existing bag.
* Fixed the "empty" BagIt profile, which allows validation against the basic BagIt spec. Fixed include:
    1. sha256 manifest and sha256 tag manifest are no longer required.
    2. Serialization is no longer required.
    3. fetch.txt is now allowed.

## 2.0.3 - March 3, 2020

* Added Beyond the Repository (BTR) BagIt profile to the default installation.
* Removed Setup Modules. The settings import/export system serves the same function and is easier to set up and distribute.
* Fixed the filter on sensitive data export. When exporting settings, DART will not export logins, passwords, or API tokens, unless they refer to environment variables.

## 2.0.2 - Feb. 28, 2020

* Added a migration to remove the DPN BagIt profile. This profile was used for internal testing and does not need to be public. Fixes issue [DPN-Object-ID and First-Version-Object-ID not generated](https://github.com/APTrust/dart/issues/224).
* Fixed [mismatched manifest algorithms](https://github.com/APTrust/dart/issues/223) in generated bags.

## 2.0.1 - Feb. 27, 2020

* Added a migration that installs a new "Empty Profile." This profile conforms to the base [BagIt Specification](https://tools.ietf.org/html/rfc8493) but does not require the user to fill in any tag values. This addresses issue #221 [Does BagIt Profile need to be mandatory](https://github.com/APTrust/dart/issues/221)
* Published [Empty Profile](https://raw.githubusercontent.com/APTrust/dart/master/profiles/empty_profile.json).
* Fixed issue #222 [Value for tag 'BagIt-Profile-Identifier' in bag-info.txt is missing](https://github.com/APTrust/dart/issues/222)
* Fixed an occasional validation error where manifest parser read empty last line of manifest as a valid entry. Fixed in commit [231afa9](https://github.com/APTrust/dart/commit/231afa9c42e181a89a82001d495d1d66509124a3)
