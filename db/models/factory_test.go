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
		Id:                        int64(rand.Intn(50000) + 1),
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
		Id:          int64(rand.Intn(50000) + 1),
		Name:        fake.Word(),
		Description: fake.Sentence(),
		JSON:        string(data),
	}
}

func FakeCredentials() *models.Credentials {
	return &models.Credentials{
		Id:          int64(rand.Intn(50000) + 1),
		Name:        fake.Word(),
		Description: fake.Sentence(),
		Key:         fake.Word(),
		Value:       fake.Word(),
	}
}

func FakeDefaultTagValue() *models.DefaultTagValue {
	profileId := rand.Intn(50000) + 1
	return &models.DefaultTagValue{
		Id:        int64(rand.Intn(50000) + 1),
		ProfileId: &profileId,
		TagFile:   fake.Word(),
		TagName:   fake.Word(),
		TagValue:  fake.Sentence(),
		UpdatedAt: RandomDateTime(),
	}
}

func FakeFile() *models.File {
	bagId := rand.Intn(50000) + 1
	return &models.File{
		Id:                int64(rand.Intn(50000) + 1),
		BagId:             &bagId,
		Name:              fake.Word(),
		Size:              int64(rand.Intn(50000) + 1),
		Md5:               fake.Word(),
		Sha256:            fake.Word(),
		StorageURL:        fmt.Sprintf("https://s3.example.com/%s", fake.Word()),
		StoredAsPartOfBag: true,
		ETag:              fake.Word(),
		StoredAt:          RandomDateTime(),
		CreatedAt:         RandomDateTime(),
		UpdatedAt:         RandomDateTime(),
	}
}

func FakeGeneralSetting() *models.GeneralSetting {
	return &models.GeneralSetting{
		Id:    int64(rand.Intn(50000) + 1),
		Name:  fake.Word(),
		Value: fake.Sentence(),
	}
}

func FakeJob() *models.Job {
	bagId := rand.Intn(50000) + 1
	fileId := rand.Intn(50000) + 1
	workflowId := rand.Intn(50000) + 1
	return &models.Job{
		Id:                 int64(rand.Intn(50000) + 1),
		BagId:              &bagId,
		FileId:             &fileId,
		WorkflowId:         &workflowId,
		WorkflowSnapshot:   "",
		CreatedAt:          RandomDateTime(),
		ScheduledStartTime: RandomDateTime(),
		StartedAt:          RandomDateTime(),
		FinishedAt:         RandomDateTime(),
		Pid:                rand.Intn(10000) + 1,
		Outcome:            fake.Word(),
		CapturedOutput:     fake.Sentence(),
	}
}

func FakeStorageService() *models.StorageService {
	credentialsId := rand.Intn(50000) + 1
	return &models.StorageService{
		Id:             int64(rand.Intn(50000) + 1),
		Name:           fake.Word(),
		Description:    fake.Sentence(),
		Protocol:       fake.Word(),
		URL:            fmt.Sprintf("https://s3.example.com/%s", fake.Word()),
		BucketOrFolder: fake.Word(),
		CredentialsId:  &credentialsId,
	}
}

func FakeTag() *models.Tag {
	bagId := rand.Intn(50000) + 1
	return &models.Tag{
		Id:    int64(rand.Intn(50000) + 1),
		BagId: &bagId,
		Name:  fake.Word(),
		Value: fake.Sentence(),
	}
}

func FakeWorkflow() *models.Workflow {
	profileId := rand.Intn(50000) + 1
	storageServiceId := rand.Intn(50000) + 1
	return &models.Workflow{
		Id:               int64(rand.Intn(50000) + 1),
		Name:             fake.Word(),
		Description:      fake.Sentence(),
		ProfileId:        &profileId,
		StorageServiceId: &storageServiceId,
	}
}

func RandomDateTime() time.Time {
	t := time.Now().UTC()
	minutes := rand.Intn(500000) * -1
	return t.Add(time.Duration(minutes) * time.Minute)
}
