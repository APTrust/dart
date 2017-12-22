const BagItVersions = ["0.97"];
const DigestAlgorithms = ["md5", "sha1", "sha224", "sha256", "sha384", "sha512"];
const RequirementOptions = ["required", "optional", "forbidden"];
const SerializationFormats = ["gzip", "tar", "zip"];
const TransferProtocols = ["ftp", "rsync", "s3", "sftp", "scp"];
const YesNo = ["Yes", "No"];

module.exports.BagItVersions = BagItVersions;
module.exports.DigestAlgorithms = DigestAlgorithms;
module.exports.RequirementOptions = RequirementOptions;
module.exports.SerializationFormats = SerializationFormats;
module.exports.TransferProtocols = TransferProtocols;
module.exports.YesNo = YesNo;
