# DART Release Notes

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
