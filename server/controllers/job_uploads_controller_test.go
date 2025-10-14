package controllers_test

import (
	"fmt"
	"net/http"
	"net/url"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type JobUploadTestInfo struct {
	Job             *core.Job
	Services        []*core.StorageService
	ServiceNames    []string
	ServiceIds      []string
	ExpectedContent []string
}

func TestJobShowUpload(t *testing.T) {
	defer core.ClearDartTable()
	info := GetJobUploadTestInfo(t)
	DoSimpleGetTest(t, fmt.Sprintf("/jobs/upload/%s", info.Job.ID), info.ExpectedContent)
}

func TestJobSaveUpload(t *testing.T) {
	defer core.ClearDartTable()
	info := GetJobUploadTestInfo(t)
	job := info.Job

	params := url.Values{}
	params.Set("direction", "next")
	for i := 0; i < 3; i++ {
		params.Add("UploadTargets", info.ServiceIds[i])
	}

	// Submit the New App Setting form with valid params.
	settings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/upload/%s", job.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/summary/%s", job.ID),
	}
	DoSimplePostTest(t, settings)

	// Make sure settings were saved.
	job = core.ObjFind(job.ID).Job()
	require.NotNil(t, job)
	assert.Equal(t, 3, len(job.UploadOps))
	for i, op := range job.UploadOps {
		assert.Equal(t, info.ServiceIds[i], op.StorageService.ID)
	}

	// If direction == previous, make sure we get the right redirect.
	params.Set("direction", "previous")
	settings = PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/upload/%s", job.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/metadata/%s", job.ID),
	}
	DoSimplePostTest(t, settings)

}

func TestGetUploadTargetsForm(t *testing.T) {
	defer core.ClearDartTable()
	info := GetJobUploadTestInfo(t)
	job := info.Job
	for i := 0; i < 3; i++ {
		op := core.NewUploadOperation(info.Services[i], []string{"file1.txt"})
		job.UploadOps = append(job.UploadOps, op)
	}
	form, err := controllers.GetUploadTargetsForm(job)
	assert.Nil(t, err)
	require.NotEmpty(t, form.Fields["UploadTargets"])

	// The form should show one choice for every storage service
	// in the DB, and only the services used in this job should
	// be selected.
	choices := form.Fields["UploadTargets"].Choices
	assert.Equal(t, len(info.ServiceIds), len(choices))
	servicesUsed := make([]string, len(job.UploadOps))
	for i, op := range job.UploadOps {
		servicesUsed[i] = op.StorageService.ID
	}
	for _, choice := range choices {
		if util.StringListContains(servicesUsed, choice.Value) {
			assert.True(t, choice.Selected)
		} else {
			assert.False(t, choice.Selected)
		}
	}
}

func TestAlreadySelectedTargets(t *testing.T) {
	defer core.ClearDartTable()

	// Job starts with one upload op. Make sure we know
	// it's selected.
	info := GetJobUploadTestInfo(t)
	serviceIds := controllers.AlreadySelectedTargets(info.Job)
	assert.Equal(t, len(info.Job.UploadOps), len(serviceIds))
	for i, op := range info.Job.UploadOps {
		assert.Equal(t, op.StorageService.ID, serviceIds[i])
	}

	// Add some more upload ops and make sure they're selected.
	for i := 0; i < 3; i++ {
		op := core.NewUploadOperation(info.Services[i], []string{"file.txt"})
		info.Job.UploadOps = append(info.Job.UploadOps, op)
	}
	serviceIds = controllers.AlreadySelectedTargets(info.Job)
	assert.Equal(t, len(info.Job.UploadOps), len(serviceIds))
	for i, op := range info.Job.UploadOps {
		assert.Equal(t, op.StorageService.ID, serviceIds[i])
	}
}

func GetJobUploadTestInfo(t *testing.T) JobUploadTestInfo {
	job := loadTestJob(t)

	serviceNames := make([]string, 0)
	serviceIds := make([]string, 0)

	// Make sure our DB contains this job's storage services.
	for _, op := range job.UploadOps {
		if op.StorageService != nil {
			require.NoError(t, core.ObjSave(op.StorageService))
			serviceIds = append(serviceIds, op.StorageService.ID)
			serviceNames = append(serviceNames, op.StorageService.Name)
		}
	}
	require.NoError(t, core.ObjSave(job))

	// Add some more services to the DB
	services := CreateStorageServices(t, 5)
	for _, ss := range services {
		serviceIds = append(serviceIds, ss.ID)
		serviceNames = append(serviceNames, ss.Name)
	}

	expected := append(serviceIds, serviceNames...)

	return JobUploadTestInfo{
		Job:             job,
		Services:        services,
		ServiceNames:    serviceNames,
		ServiceIds:      serviceIds,
		ExpectedContent: expected,
	}
}

func CreateStorageServices(t *testing.T, count int) []*core.StorageService {
	services := make([]*core.StorageService, count)
	for i := 0; i < count; i++ {
		name := fmt.Sprintf("Service %d", i+1)
		host := fmt.Sprintf("service-%d.example.com", i+1)
		ss := getFakeService(name, host)
		require.NoError(t, core.ObjSave(ss))
		services[i] = ss
	}
	return services
}
