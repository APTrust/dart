-- General settings are for things like the path to the working
-- directory where bags will be assembled, etc.
create table if not exists general_settings (
       id integer primary key,
       "name" text not null unique,
       "value" text
);

-- Credentials store credentials for accessing remote storage services.
create table if not exists credentials (
       id integer primary key,
       "name" text not null unique,
       description text,
       "key" text not null,
       "value" text not null
);

-- Storage services stores information about storage services to
-- which bags and files may be uploaded. The protocol column will
-- contain values like "s3" (initially) and "sftp" (possible later).
-- The url contains the host information necessary to connect to the
-- service. The bucket_or_folder column contains the name of the
-- bucket (s3) or sub-folder (sftp) into which items should be uploaded.
create table if not exists storage_services (
       id integer primary key,
       "name" text not null unique,
       description text,
       protocol text not null,
       url text not null,
       bucket_or_folder text,
       credentials_id integer null,

       foreign key(credentials_id) references credentials(id)
);

-- BagIt profiles contains blobs of JSON that describe BagIt profiles.
create table if not exists bagit_profiles (
       id integer primary key,
       "name" text not null unique,
       description text,
       json text not null,
       updated_at datetime default current_timestamp
);

-- Default tag values are values that are used across all bags adhering to a
-- profile. For example, both APTrust and DPN require the Source-Organization
-- tag, and that tag will be the same across every bag an organization creates.
-- This table lets users specify their default tags once, instead of every time
-- they create a bag.
create table if not exists default_tag_values (
       id integer primary key,
       profile_id integer not null,
       tag_file text not null,
       tag_name text not null,
       tag_value text not null,
       updated_at datetime default current_timestamp,

       constraint unique_default_tag unique (profile_id, tag_file, tag_name),
       foreign key(profile_id) references bagit_profiles(id)
);

-- Workflows table describes workflows, which typically include bagging content
-- according to a specific profile and then uploading it to some storage service.
create table if not exists workflows (
       id integer primary key,
       "name" text not null unique,
       description text,
       profile_id integer not null,
       storage_service_id integer null,

       foreign key(profile_id) references bagit_profiles(id)
       foreign key(storage_service_id) references storage_services(id)
);

-- Bags contains information about bags that easy-store has created.
-- storage_url contains the location to which this bag was uploaded,
-- if it was uplaoded anywhere. metadata_url contains information about
-- where the bag metadata package was stored, if anywhere. (That will be
-- an option later for uploads: to store bag.meta.json alongside bag.tar.)
-- storage_registry_identifier is the name or id that was assigned to this
-- item by the storage service to which it was uploaded. For example,
-- APTrust and DPN assign UUIDs to uploaded objects. The
-- storage_registry_identifier can help you find information about the
-- object from the storage service's Web UI or REST API.
create table if not exists bags (
       id integer primary key,
       "name" text not null unique,
       "size" bigint not null default -1,
       storage_url text,
       metadata_url text,
       storage_registry_identifier text,
       create_at datetime,
       updated_at datetime default current_timestamp
);

-- Files contains information about unbagged files that easy-store has
-- dealt with. storage_url describes where the file is stored and may
-- be null. etag is the etag returned by the S3 service for this file,
-- if available. If storage_url is null, and stored_as_part_of_bag is true,
-- this file was stored as part of a bag.
create table if not exists files (
       id integer primary key,
       bag_id integer,
       "name" text not null unique,
       "size" bigint not null default -1,
       md5 text,
       sha256 text,
       storage_url text,
       stored_as_part_of_bag boolean default false,
       etag text,
       stored_at datetime,
       created_at datetime,
       updated_at datetime default current_timestamp,

       foreign key(bag_id) references bags(id)
);

-- Jobs contains information about jobs that easy-store has scheduled
-- or completed. The workflow_snapshot column contains a JSON snapshot
-- of the workflow at the time the job was executed. We store a snapshot
-- because the workflow definition could change after the job is executed,
-- and we don't want to hold a reference to a misleading workflow_id.
create table if not exists jobs (
       id integer primary key,
       bag_id integer null,
       file_id integer null,
       workflow_snapshot text,
       created_at datetime,
       scheduled_start_time datetime,
       started_at datetime,
       finished_at datetime,
       outcome text,
       pid integer,
       captured_output text,

       foreign key(bag_id) references bags(id),
       foreign key(file_id) references files(id)
);
