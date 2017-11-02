PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
--CREATE TABLE "app_settings" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"name" varchar(255),"value" varchar(255) );
INSERT INTO "app_settings" VALUES(1,'2017-09-30 09:47:16.330681732-04:00','2017-09-30 09:47:16.330681732-04:00',NULL,'Staging Directory','/Users/apd4n/tmp/easy-store');
--CREATE TABLE "bags" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"name" varchar(255),"size" bigint,"storage_url" varchar(255),"metadata_url" varchar(255),"remote_identifier" varchar(255),"stored_at" datetime );
--CREATE TABLE "bag_it_profiles" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"name" varchar(255),"description" varchar(255),"json" varchar(255) );
INSERT INTO "bag_it_profiles" VALUES(1,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.792173172-04:00',NULL,'APTrust (Med School Settings)','Profile for APTrust bags with default settings for Med School','{
    "BagIt-Profile-Info":{
        "BagIt-Profile-Identifier":"https://wiki.aptrust.org/APTrust_BagIt_Profile",
        "Source-Organization":"aptrust.org",
        "Contact-Name":"A. Diamond",
        "Contact-Email":"support@aptrust.org",
        "External-Description":"BagIt profile for ingesting content into APTrust.",
        "Version":"2.0"
    },
    "Accept-BagIt-Version":[
        "0.97"
    ],
    "Allow-Misc-Top-Level-Files":true,
    "Allow-Misc-Directories":true,
    "Allow-Fetch.txt":false,
    "Manifests-Required":[
        "md5"
    ],
    "Serialization":"required",
    "Accept-Serialization":[
        "application/tar"
    ],
    "Tag-Manifests-Required":[

    ],
    "Tag-Files-Required":{
        "bagit.txt":{
            "BagIt-Version":{
                "required":true,
                "values":["0.97"]
            },
            "Tag-File-Character-Encoding":{
                "required":true,
                "values":["UTF-8"]
            }
        },
        "bag-info.txt":{
            "Source-Organization":{
                "required":true,
                "emptyOk":true
            },
            "Bag-Count":{
                "required":false,
                "emptyOk":true
            },
            "Bagging-Date":{
                "required":false,
                "emptyOk":true
            },
            "Internal-Sender-Description":{
                "required":false,
                "emptyOk":true
            },
            "Internal-Sender-Identifier":{
                "required":false,
                "emptyOk":true
            },
            "Payload-Oxum":{
                "required":false,
                "emptyOk":true
            }
        },
        "aptrust-info.txt":{
            "Title":{
                "required":true,
                "emptyOk":false
            },
            "Access":{
                "required":true,
                "emptyOk":false,
                "values":[
                    "Consortia",
                    "Institution",
                    "Restricted"
                ]
            },
            "Description":{
                "required":false,
                "emptyOk":true
            }
        }
    }
}
');
INSERT INTO "bag_it_profiles" VALUES(2,'0001-01-01 00:00:00+00:00','2017-09-30 09:54:06.78929732-04:00',NULL,'DPN BagIt Profile','Profile for DPN bags','{
    "BagIt-Profile-Info": {
        "BagIt-Profile-Identifier": "https://wiki.aptrust.org/DPN_BagIt_Profile",
        "Source-Organization": "dpn.org",
        "Contact-Name": "A. Diamond",
        "Contact-Email": "support@dpn.org",
        "External-Description": "BagIt profile for ingesting content into DPN.",
        "Version": "2.0"
        },
    "Accept-BagIt-Version": [
        "0.97"
        ],
    "Allow-Misc-Top-Level-Files": false,
    "Allow-Misc-Directories": true,
    "Allow-Fetch.txt": false,
    "Manifests-Required": [
        "sha256"
        ],
    "Serialization": "required",
    "Accept-Serialization": [
        "application/tar"
        ],
    "Tag-Manifests-Required": [
        "sha256"
        ],
    "Tag-Files-Required": {
        "bagit.txt": {
            "BagIt-Version":{
                "required":true,
                "values":["0.97"]
            },
            "Tag-File-Character-Encoding":{
                "required":true,
                "values":["UTF-8"]
            }
        },
        "bag-info.txt": {
            "Source-Organization": {
                "required": true,
                "emptyOK": true
                },
            "Organization-Address": {
                "required": true,
                "emptyOK": true
                },
            "Contact-Name": {
                "required": true,
                "emptyOK": true
                },
            "Contact-Phone": {
                "required": true,
                "emptyOK": true
                },
            "Contact-Email": {
                "required": true,
                "emptyOK": true
                },
            "Bagging-Date": {
                "required": true,
                "emptyOK": true
                },
            "Bag-Size": {
                "required": true,
                "emptyOK": true
                },
            "Bag-Group-Identifier": {
                "required": true,
                "emptyOK": true
                },
            "Bag-Count": {
                "required": true,
                "emptyOK": true
                }
            },
        "dpn-tags/dpn-info.txt": {
            "DPN-Object-ID": {
                "required": true,
                "emptyOk": false
                },
            "Local-ID": {
                "required": true,
                "emptyOk": false
                },
            "Ingest-Node-Name": {
                "required": true,
                "emptyOk": false
                },
            "Ingest-Node-Address": {
                "required": true,
                "emptyOk": true
                },
            "Ingest-Node-Contact-Name": {
                "required": true,
                "emptyOk": true
                },
            "Ingest-Node-Contact-Email": {
                "required": true,
                "emptyOk": true
                },
            "Version-Number": {
                "required": true,
                "emptyOk": false
                },
            "First-Version-Object-ID": {
                "required": true,
                "emptyOk": false
                },
            "Interpretive-Object-ID": {
                "required": true,
                "emptyOk": true
                },
            "Rights-Object-ID": {
                "required": true,
                "emptyOk": true
                },
            "Bag-Type": {
                "required": true,
                "emptyOk": false,
                "values": ["data", "interpretive", "rights"]
            }
        }
    }
}
');
INSERT INTO "bag_it_profiles" VALUES(3,'0001-01-01 00:00:00+00:00','2017-09-30 10:05:36.79514063-04:00',NULL,'APTrust (Law Library Settings)','BagIt profile for APTrust with Law Library default settings','{
    "BagIt-Profile-Info":{
        "BagIt-Profile-Identifier":"https://wiki.aptrust.org/APTrust_BagIt_Profile",
        "Source-Organization":"aptrust.org",
        "Contact-Name":"A. Diamond",
        "Contact-Email":"support@aptrust.org",
        "External-Description":"BagIt profile for ingesting content into APTrust.",
        "Version":"2.0"
    },
    "Accept-BagIt-Version":[
        "0.97"
    ],
    "Allow-Misc-Top-Level-Files":true,
    "Allow-Misc-Directories":true,
    "Allow-Fetch.txt":false,
    "Manifests-Required":[
        "md5"
    ],
    "Serialization":"required",
    "Accept-Serialization":[
        "application/tar"
    ],
    "Tag-Manifests-Required":[

    ],
    "Tag-Files-Required":{
        "bagit.txt":{
            "BagIt-Version":{
                "required":true,
                "values":["0.97"]
            },
            "Tag-File-Character-Encoding":{
                "required":true,
                "values":["UTF-8"]
            }
        },
        "bag-info.txt":{
            "Source-Organization":{
                "required":true,
                "emptyOk":true
            },
            "Bag-Count":{
                "required":false,
                "emptyOk":true
            },
            "Bagging-Date":{
                "required":false,
                "emptyOk":true
            },
            "Internal-Sender-Description":{
                "required":false,
                "emptyOk":true
            },
            "Internal-Sender-Identifier":{
                "required":false,
                "emptyOk":true
            },
            "Payload-Oxum":{
                "required":false,
                "emptyOk":true
            }
        },
        "aptrust-info.txt":{
            "Title":{
                "required":true,
                "emptyOk":false
            },
            "Access":{
                "required":true,
                "emptyOk":false,
                "values":[
                    "Consortia",
                    "Institution",
                    "Restricted"
                ]
            },
            "Description":{
                "required":false,
                "emptyOk":true
            }
        }
    }
}
');
--CREATE TABLE "default_tag_values" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"bag_it_profile_id" bigint,"tag_file" varchar(255),"tag_name" varchar(255),"tag_value" varchar(255) );
INSERT INTO "default_tag_values" VALUES(1,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.798982802-04:00',NULL,1,'aptrust-info.txt','Description','Bag of various stuff created for a software demo');
INSERT INTO "default_tag_values" VALUES(2,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.800765468-04:00',NULL,1,'bag-info.txt','Internal-Sender-Description','Test bag full of stuff');
INSERT INTO "default_tag_values" VALUES(3,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.799988422-04:00',NULL,1,'bagit.txt','Tag-File-Character-Encoding','UTF-8');
INSERT INTO "default_tag_values" VALUES(4,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.801518637-04:00',NULL,1,'aptrust-info.txt','Title','Partner Tools Demo Bag (Config #1)');
INSERT INTO "default_tag_values" VALUES(5,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.802251585-04:00',NULL,1,'bag-info.txt','Payload-Oxum','');
INSERT INTO "default_tag_values" VALUES(6,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.796668257-04:00',NULL,1,'aptrust-info.txt','Access','Consortia');
INSERT INTO "default_tag_values" VALUES(7,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.794900032-04:00',NULL,1,'bagit.txt','BagIt-Version','0.97');
INSERT INTO "default_tag_values" VALUES(8,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.793903315-04:00',NULL,1,'bag-info.txt','Bagging-Date','2017-09-30');
INSERT INTO "default_tag_values" VALUES(9,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.79744381-04:00',NULL,1,'bag-info.txt','Internal-Sender-Identifier','bag-1997');
INSERT INTO "default_tag_values" VALUES(10,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.795830664-04:00',NULL,1,'bag-info.txt','Source-Organization','University of Virginia');
INSERT INTO "default_tag_values" VALUES(11,'0001-01-01 00:00:00+00:00','2017-09-30 10:06:06.798221236-04:00',NULL,1,'bag-info.txt','Bag-Count','');
INSERT INTO "default_tag_values" VALUES(12,'2017-09-30 09:54:06.790956113-04:00','2017-09-30 09:54:06.790956113-04:00',NULL,2,'bag-info.txt','Bag-Group-Identifier','');
INSERT INTO "default_tag_values" VALUES(13,'2017-09-30 09:54:06.791775103-04:00','2017-09-30 09:54:06.791775103-04:00',NULL,2,'dpn-tags/dpn-info.txt','Rights-Object-ID','00000000-0000-0000-0000-000000000000');
INSERT INTO "default_tag_values" VALUES(14,'2017-09-30 09:54:06.795616476-04:00','2017-09-30 09:54:06.795616476-04:00',NULL,2,'dpn-tags/dpn-info.txt','Bag-Type','data');
INSERT INTO "default_tag_values" VALUES(15,'2017-09-30 09:54:06.796820732-04:00','2017-09-30 09:54:06.796820732-04:00',NULL,2,'dpn-tags/dpn-info.txt','Ingest-Node-Contact-Email','support@aptrust.org');
INSERT INTO "default_tag_values" VALUES(16,'2017-09-30 09:54:06.797747131-04:00','2017-09-30 09:54:06.797747131-04:00',NULL,2,'dpn-tags/dpn-info.txt','Ingest-Node-Contact-Name','A. Diamond');
INSERT INTO "default_tag_values" VALUES(17,'2017-09-30 09:54:06.798594037-04:00','2017-09-30 09:54:06.798594037-04:00',NULL,2,'bag-info.txt','Contact-Email','jennie@example.com');
INSERT INTO "default_tag_values" VALUES(18,'2017-09-30 09:54:06.799428906-04:00','2017-09-30 09:54:06.799428906-04:00',NULL,2,'bag-info.txt','Bagging-Date','2017-09-30');
INSERT INTO "default_tag_values" VALUES(19,'2017-09-30 09:54:06.800200191-04:00','2017-09-30 09:54:06.800200191-04:00',NULL,2,'dpn-tags/dpn-info.txt','First-Version-Object-ID','a8816b83-3010-49e9-a6ec-b96cf46d2c8c');
INSERT INTO "default_tag_values" VALUES(20,'2017-09-30 09:54:06.801015076-04:00','2017-09-30 09:54:06.801015076-04:00',NULL,2,'dpn-tags/dpn-info.txt','Local-ID','bag-1234');
INSERT INTO "default_tag_values" VALUES(21,'2017-09-30 09:54:06.801924702-04:00','2017-09-30 09:54:06.801924702-04:00',NULL,2,'dpn-tags/dpn-info.txt','Interpretive-Object-ID','00000000-0000-0000-0000-000000000000');
INSERT INTO "default_tag_values" VALUES(22,'2017-09-30 09:54:06.802713678-04:00','2017-09-30 09:54:06.802713678-04:00',NULL,2,'bagit.txt','BagIt-Version','0.97');
INSERT INTO "default_tag_values" VALUES(23,'2017-09-30 09:54:06.803325385-04:00','2017-09-30 09:54:06.803325385-04:00',NULL,2,'bag-info.txt','Contact-Name','Jennie Igotyournumber');
INSERT INTO "default_tag_values" VALUES(24,'2017-09-30 09:54:06.804068683-04:00','2017-09-30 09:54:06.804068683-04:00',NULL,2,'bagit.txt','Tag-File-Character-Encoding','UTF-8');
INSERT INTO "default_tag_values" VALUES(25,'2017-09-30 09:54:06.804740431-04:00','2017-09-30 09:54:06.804740431-04:00',NULL,2,'bag-info.txt','Bag-Size','');
INSERT INTO "default_tag_values" VALUES(26,'2017-09-30 09:54:06.805344224-04:00','2017-09-30 09:54:06.805344224-04:00',NULL,2,'bag-info.txt','Source-Organization','School of Hard Knocks');
INSERT INTO "default_tag_values" VALUES(27,'2017-09-30 09:54:06.806031857-04:00','2017-09-30 09:54:06.806031857-04:00',NULL,2,'bag-info.txt','Organization-Address','1221 5th Ave. NYC, 10011');
INSERT INTO "default_tag_values" VALUES(28,'2017-09-30 09:54:06.806864463-04:00','2017-09-30 09:54:06.806864463-04:00',NULL,2,'dpn-tags/dpn-info.txt','DPN-Object-ID','a8816b83-3010-49e9-a6ec-b96cf46d2c8c');
INSERT INTO "default_tag_values" VALUES(29,'2017-09-30 09:54:06.807700053-04:00','2017-09-30 09:54:06.807700053-04:00',NULL,2,'dpn-tags/dpn-info.txt','Ingest-Node-Address','400 McCormick Rd, Charlottesville, VA 22903');
INSERT INTO "default_tag_values" VALUES(30,'2017-09-30 09:54:06.808560072-04:00','2017-09-30 09:54:06.808560072-04:00',NULL,2,'dpn-tags/dpn-info.txt','Ingest-Node-Name','APTrust');
INSERT INTO "default_tag_values" VALUES(31,'2017-09-30 09:54:06.809317292-04:00','2017-09-30 09:54:06.809317292-04:00',NULL,2,'dpn-tags/dpn-info.txt','Version-Number','1');
INSERT INTO "default_tag_values" VALUES(32,'2017-09-30 09:54:06.80998835-04:00','2017-09-30 09:54:06.80998835-04:00',NULL,2,'bag-info.txt','Contact-Phone','867-5309');
INSERT INTO "default_tag_values" VALUES(33,'2017-09-30 09:54:06.810887014-04:00','2017-09-30 09:54:06.810887014-04:00',NULL,2,'bag-info.txt','Bag-Count','1');
INSERT INTO "default_tag_values" VALUES(34,'2017-09-30 10:05:36.797129839-04:00','2017-09-30 10:05:36.797129839-04:00',NULL,3,'bagit.txt','BagIt-Version','0.97');
INSERT INTO "default_tag_values" VALUES(35,'2017-09-30 10:05:36.797918341-04:00','2017-09-30 10:05:36.797918341-04:00',NULL,3,'bagit.txt','Tag-File-Character-Encoding','UTF-8');
INSERT INTO "default_tag_values" VALUES(36,'2017-09-30 10:05:36.798660571-04:00','2017-09-30 10:05:36.798660571-04:00',NULL,3,'bag-info.txt','Bag-Count','');
INSERT INTO "default_tag_values" VALUES(37,'2017-09-30 10:05:36.799372357-04:00','2017-09-30 10:05:36.799372357-04:00',NULL,3,'bag-info.txt','Bagging-Date','2017-10-05');
INSERT INTO "default_tag_values" VALUES(38,'2017-09-30 10:05:36.800046703-04:00','2017-09-30 10:05:36.800046703-04:00',NULL,3,'aptrust-info.txt','Access','Consortia');
INSERT INTO "default_tag_values" VALUES(39,'2017-09-30 10:05:36.800706288-04:00','2017-09-30 10:05:36.800706288-04:00',NULL,3,'bag-info.txt','Internal-Sender-Description','Bag of law school stuff');
INSERT INTO "default_tag_values" VALUES(40,'2017-09-30 10:05:36.801373765-04:00','2017-09-30 10:05:36.801373765-04:00',NULL,3,'bag-info.txt','Internal-Sender-Identifier','va-legal-code-2017.A');
INSERT INTO "default_tag_values" VALUES(41,'2017-09-30 10:05:36.802012382-04:00','2017-09-30 10:05:36.802012382-04:00',NULL,3,'bag-info.txt','Source-Organization','UVA Law School');
INSERT INTO "default_tag_values" VALUES(42,'2017-09-30 10:05:36.802681063-04:00','2017-09-30 10:05:36.802681063-04:00',NULL,3,'aptrust-info.txt','Title','Partner Tools Demo Bag (Config #2)');
INSERT INTO "default_tag_values" VALUES(43,'2017-09-30 10:05:36.803320708-04:00','2017-09-30 10:05:36.803320708-04:00',NULL,3,'bag-info.txt','Payload-Oxum','');
INSERT INTO "default_tag_values" VALUES(44,'2017-09-30 10:05:36.803908935-04:00','2017-09-30 10:05:36.803908935-04:00',NULL,3,'aptrust-info.txt','Description','Demo bag full of various stuff');
--CREATE TABLE "files" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"bag_id" bigint,"name" varchar(255),"size" bigint,"md5" varchar(255),"sha256" varchar(255),"storage_url" varchar(255),"stored_as_part_of_bag" bool,"e_tag" varchar(255),"stored_at" datetime );
--CREATE TABLE "jobs" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"bag_id" bigint,"file_id" bigint,"scheduled_start_time" datetime,"started_at" datetime,"finished_at" datetime,"pid" integer,"outcome" varchar(255),"captured_output" varchar(255) );
--CREATE TABLE "storage_services" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"name" varchar(255),"description" varchar(255),"protocol" varchar(255),"url" varchar(255),"bucket_or_folder" varchar(255),"login_name" varchar(255),"login_password" varchar(255),"login_extra" varchar(255) );
INSERT INTO "storage_services" VALUES(1,'0001-01-01 00:00:00+00:00','2017-09-30 11:28:44.191298-04:00',NULL,'APTrust Ingest Bucket','S3 receiving bucket for ingesting objects into APTrust','s3','s3.amazonaws.com','aptrust.receiving.test.virginia.edu','ENV:AWS_ACCESS_KEY_ID','ENV:AWS_SECRET_ACCESS_KEY','');
INSERT INTO "storage_services" VALUES(2,'2017-09-30 10:01:29.245859352-04:00','2017-09-30 10:01:29.245859352-04:00',NULL,'Campus Data Center','FTP backup in local data center','ftp','ftp://example.com','backup/tar_files','user1','user1','');
--CREATE TABLE "tags" ("id" integer primary key autoincrement,"created_at" datetime,"updated_at" datetime,"deleted_at" datetime,"bag_id" bigint,"rel_file_path" varchar(255),"name" varchar(255),"value" varchar(255) );
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('app_settings',1);
INSERT INTO "sqlite_sequence" VALUES('bag_it_profiles',3);
INSERT INTO "sqlite_sequence" VALUES('default_tag_values',44);
INSERT INTO "sqlite_sequence" VALUES('storage_services',2);
-- CREATE INDEX idx_app_settings_deleted_at ON "app_settings"(deleted_at) ;
-- CREATE INDEX idx_bags_deleted_at ON "bags"(deleted_at) ;
-- CREATE INDEX idx_bag_it_profiles_deleted_at ON "bag_it_profiles"(deleted_at) ;
-- CREATE INDEX idx_default_tag_values_deleted_at ON "default_tag_values"(deleted_at) ;
-- CREATE INDEX idx_files_deleted_at ON "files"(deleted_at) ;
-- CREATE INDEX idx_jobs_deleted_at ON "jobs"(deleted_at) ;
-- CREATE INDEX idx_storage_services_deleted_at ON "storage_services"(deleted_at) ;
-- CREATE INDEX idx_tags_deleted_at ON "tags"(deleted_at) ;
COMMIT;
