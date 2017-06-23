# APTrust BagIt

This is the APTrust library for creating and validating bags that conform to
explicit BagIt profiles. The profiles are similar to those in the
bagit-profiles project at https://github.com/ruebot/bagit-profiles. The major
difference between these profiles and ruebot's is that these provide broader
support for required tags in specific tag files other than bag-info.txt.

## Goals

This project aims to provide the following:

* Configurable bag creation and validation through the use of BagIt profiles.
* Stand-alone tools for building and validating bags that requires no external
libraries. Each tool is a stand-alone executable binary.
* Multi-platform support, including Linux, Mac, and Windows.
* A simple, scriptable command-line interface.
* Reasonable peformance, even when creating and validating large bags that
include tens of thousands of files.

## Executables

* apt_create_bag creates a bag.
* apt_validate_bag validates an existing bag.
* apt_validate_profile validates a BagIt profile.

## Configuration Files

In addition the executables, this project includes two types of config files:

* Profiles describe the structure and required elements of a bag, and are
used both to build and to validate bags.
* Defaults describe a set of default tag values to include when creating new
bags. Defaults include bits of information that you expect to be consistent
across all of the bags you produce. Defaults may include your institution
name, contact information, etc.
