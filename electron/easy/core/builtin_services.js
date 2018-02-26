// builtin storage services
const StorageService = require('./storage_service');

const APTrustDemoId = "739b14fd-0b02-4bb8-9a64-8d8c74ab9e4c";
const APTrustProdId = "40aa1fe2-8463-47ac-a582-4bf92db361ee";

var aptDemo = new StorageService();
aptDemo.id = APTrustDemoId;
aptDemo.name = "APTrust Test Repository";
aptDemo.description = "APTrust demo/test repository for testing your workflows.";
aptDemo.protocol = "s3";
aptDemo.host = "s3.amazonaws.com";

var aptProd = new StorageService();
aptProd.id = APTrustProdId;
aptProd.name = "APTrust Production Repository";
aptProd.description = "APTrust production repository for long-term preservation.";
aptProd.protocol = "s3";
aptProd.host = "s3.amazonaws.com";

module.exports.APTrustDemoId = APTrustDemoId;
module.exports.APTrustProdId = APTrustProdId;
module.exports.APTrustDemoService = aptDemo;
module.exports.APTrustProdService = aptProd;
