package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/icrowley/fake"
	"github.com/satori/go.uuid"
	"io/ioutil"
	"math/rand"
	"time"
)

func FakeBag() *models.Bag {
	bagName := fake.Word()
	return &models.Bag{
		Id:                        rand.Intn(50000) + 1,
		Name:                      bagName,
		Size:                      int64(rand.Intn(50000) + 1),
		StorageURL:                fmt.Sprintf("https://s3.example.com/%s.tar", bagName),
		MetadataURL:               fmt.Sprintf("https://s3.example.com/%s_meta.tar", bagName),
		StorageRegistryIdentifier: uuid.NewV4().String(),
		StoredAt:                  RandomDateTime(),
		CreatedAt:                 RandomDateTime(),
		UpdatedAt:                 RandomDateTime(),
	}
}

func FakeBagItProfile() *models.BagItProfile {
	profilePath, _ := testutil.GetPathToTestProfile("aptrust_bagit_profile_2.0.json")
	data, err := ioutil.ReadFile(profilePath)
	if err != nil {
		panic(err.Error())
	}
	return &models.BagItProfile{
		Id:          rand.Intn(50000) + 1,
		Name:        fake.Word(),
		Description: fake.Sentence(),
		JSON:        string(data),
	}
}

func FakeCredentials() *models.Credentials {
	return &models.Credentials{
		Id:          rand.Intn(50000) + 1,
		Name:        fake.Word(),
		Description: fake.Sentence(),
		Key:         fake.Word(),
		Value:       fake.Word(),
	}
}

func FakeDefaultTagValue() *models.DefaultTagValue {
	profileId := rand.Intn(50000) + 1
	return &models.DefaultTagValue{
		Id:        rand.Intn(50000) + 1,
		ProfileId: &profileId,
		TagFile:   fake.Word(),
		TagName:   fake.Word(),
		TagValue:  fake.Sentence(),
		UpdatedAt: RandomDateTime(),
	}
}

func FakeFile() *models.File {
	return nil
}

func FakeGeneralSetting() *models.GeneralSetting {
	return nil
}

func FakeJob() *models.Job {
	return nil
}

func FakeStorageService() *models.StorageService {
	return nil
}

func FakeTag() *models.Tag {
	return nil
}

func FakeWorkflow() *models.Workflow {
	return nil
}

func RandomDateTime() time.Time {
	t := time.Now().UTC()
	minutes := rand.Intn(500000) * -1
	return t.Add(time.Duration(minutes) * time.Minute)
}
