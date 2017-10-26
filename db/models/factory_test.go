package models_test

import (
	"crypto/md5"
	"crypto/sha256"
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/icrowley/fake"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"io/ioutil"
	"math/rand"
	"strings"
)

func InitTestDB() (*gorm.DB, error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		if db != nil {
			db.Close()
		}
		return nil, err
	}
	err = db.AutoMigrate(
		&models.AppSetting{},
		&models.Bag{},
		&models.BagItProfile{},
		&models.DefaultTagValue{},
		&models.File{},
		&models.Job{},
		&models.StorageService{},
		&models.Tag{},
		&models.Workflow{},
	).Error
	return db, err
}

func FakeAppSetting() *models.AppSetting {
	return &models.AppSetting{
		Name:  fake.Word(),
		Value: fake.Sentence(),
	}
}

func FakeBag() *models.Bag {
	return &models.Bag{
		Name:             fake.Word(),
		Size:             rand.Int63n(9999999),
		RemoteIdentifier: fake.Sentence(),
	}
}

func FakeBagItProfile() (*models.BagItProfile, error) {
	filepath, err := testutil.GetPathToTestProfile("aptrust_bagit_profile_2.0.json")
	if err != nil {
		return nil, err
	}
	jsonBytes, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, err
	}
	return &models.BagItProfile{
		Name:        fake.Word(),
		Description: fake.Sentence(),
		JSON:        string(jsonBytes),
	}, nil
}

// This creates a bagit profile with default tags and saves it
// to the database.
func CreateFakeBagItProfileWithTags(db *gorm.DB) (*models.BagItProfile, error) {
	bagItProfile, err := FakeBagItProfile()
	if err != nil {
		return nil, err
	}
	err = db.Save(bagItProfile).Error
	if err != nil {
		return nil, err
	}
	p, err := bagItProfile.Profile()
	if err != nil {
		return nil, err
	}
	// Add default tag values to the profile, and use valid
	// values if the profile specifies a list of them for
	// any given tag.
	for relFilePath, tagMap := range p.TagFilesRequired {
		for tagname, tagDef := range tagMap {
			tagValue := fake.Word()
			if len(tagDef.Values) > 0 {
				tagValue = tagDef.Values[rand.Intn(len(tagDef.Values))]
			}
			dtv := FakeDefaultTagValue()
			dtv.BagItProfileID = bagItProfile.ID
			dtv.TagFile = relFilePath
			dtv.TagName = tagname
			dtv.TagValue = tagValue
			err = db.Save(dtv).Error
			if err != nil {
				return nil, err
			}
		}
	}
	return bagItProfile, nil
}

func FakeDefaultTagValue() *models.DefaultTagValue {
	return &models.DefaultTagValue{
		TagFile:  fake.Word(),
		TagName:  fake.Word(),
		TagValue: fake.Sentence(),
	}
}

func FakeFile() *models.File {
	return &models.File{
		Name:   strings.Replace(fake.Sentence(), " ", "/", -1),
		Size:   rand.Int63n(99999),
		Md5:    fmt.Sprintf("%x", md5.Sum([]byte(fake.Sentence()))),
		Sha256: fmt.Sprintf("%x", sha256.Sum256([]byte(fake.Sentence()))),
	}
}

func FakeJob() *models.Job {
	return &models.Job{}
}

func FakeStorageService() *models.StorageService {
	return &models.StorageService{
		Name:           fake.Word(),
		Protocol:       "s3",
		URL:            fmt.Sprintf("https://%s", fake.DomainName()),
		BucketOrFolder: fake.Word(),
		LoginName:      fake.FirstName(),
		LoginPassword:  fake.Word(),
	}
}

func FakeWorkflow() *models.Workflow {
	return &models.Workflow{
		Name:                fake.Word(),
		Description:         fake.Sentence(),
		SerializationFormat: "tar",
	}
}

// CreateFakeJobWithRelations creates and saves a Job with all of
// its sub-components. This job includes both a File and a Bag.
// In reality, jobs will include a File or a Bag, but not both.
func CreateFakeJobWithRelations(db *gorm.DB) (*models.Job, error) {
	bag := FakeBag()
	err := db.Save(bag).Error
	if err != nil {
		return nil, err
	}
	for i := 0; i < 5; i++ {
		f := FakeFile()
		f.BagID = bag.ID
		err = db.Save(f).Error
		if err != nil {
			return nil, err
		}
	}
	file := FakeFile()
	err = db.Save(file).Error
	if err != nil {
		return nil, err
	}
	storageService := FakeStorageService()
	err = db.Save(storageService).Error
	if err != nil {
		return nil, err
	}

	// Creates **and saves** a BagItProfile, with tags.
	bagItProfile, err := CreateFakeBagItProfileWithTags(db)
	if err != nil {
		return nil, err
	}

	workflow := FakeWorkflow()
	workflow.BagItProfileID = bagItProfile.ID
	workflow.StorageServiceID = storageService.ID
	err = db.Save(workflow).Error
	if err != nil {
		return nil, err
	}
	job := FakeJob()
	job.BagID = bag.ID
	job.FileID = file.ID
	job.WorkflowID = workflow.ID
	err = db.Save(job).Error
	if err != nil {
		return nil, err
	}
	return job, nil
}
