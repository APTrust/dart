-- Load some bags
insert into bags (name, size, storage_url, metadata_url, storage_registry_identifier, created_at, stored_at) values
("First Bag", 558990, "https://s3.amazonaws.com/aptrust.receving.virginia.edu/first_bag.tar", "", "virginia.edu/first_bag", "2017-08-24T19:01:17Z", "2017-08-24T22:15:17Z"),
("Second Bag", 334980049, "https://s3.amazonaws.com/aptrust.receving.virginia.edu/second_bag.tar", "", "virginia.edu/second_bag", "2017-08-24T19:38:17Z", "2017-08-24T22:59:11Z");

-- Load some files
insert into files (bag_id, name, size, md5, sha256, storage_url, stored_as_part_of_bag, etag, created_at, stored_at, updated_at) values
(1, "image.jpg", 21557, 'a2309bc998', '34d78ae92bcf377781', 'https://s3.amazonaws.com/aptrust.preservation.storage/12345', 1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z'),
(1, "document.pdf", 18313, 'dba6cc998', 'a1589eccb22dafc1', 'https://s3.amazonaws.com/aptrust.preservation.storage/67899', 1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z'),
(1, "movie.mov", 3489663, '44623738', 'dbdcca8977743637dc', 'https://s3.amazonaws.com/aptrust.preservation.storage/99887', 1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z'),
(2, "image.jpg", 21557, 'a2309bc998', '34d78ae92bcf377781', 'https://s3.amazonaws.com/aptrust.preservation.storage/01019', 1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z'),
(2, "document.pdf", 18313, 'dba6cc998', 'a1589eccb22dafc1', 'https://s3.amazonaws.com/aptrust.preservation.storage/31337',1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z'),
(2, "movie.mov", 3489663, '44623738', 'dbdcca8977743637dc', 'https://s3.amazonaws.com/aptrust.preservation.storage/78554',1, '', '2017-08-24T19:01:17Z', '2017-08-24T21:19:17Z', '2017-08-24T19:01:17Z');

-- Load some storage services
INSERT INTO "storage_services" VALUES(1,'APTrust S3 Test Bucket','Uploads files to APTrust''s test bucket','S3','https://s3.amazonaws.com','aptrust.test.test','LOGIN_ONE','PASSWORD_ONE','');
INSERT INTO "storage_services" VALUES(2,'Other S3 service','Upload to loser S3 account','S3','https://s3.amazonaws.com','aptrust.loser.bucket','LOGIN TWO','PASSWORD TWO','');

-- Load some workflows
insert into workflows (name, description, profile_id, storage_service_id) values
("APTrust package & upload", "Package bag in APTrust 2.0 format and upload to S3 receiving bucket", 1, 1),
("DPN package & upload", "Package bag in DPN 2.0 format and upload to DPN bucket", 2, 2);
