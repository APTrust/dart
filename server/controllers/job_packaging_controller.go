package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /jobs/packaging/:id
func JobShowPackaging(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	baggingDir, err := core.GetAppSetting(constants.BaggingDirectory)
	if err != nil {
		baggingDir = filepath.Join(core.Dart.Paths.Documents, "DART")
		core.Dart.Log.Warningf("Bagging Directory not set. Defaulting to %s", baggingDir)
	}

	var workflow *core.Workflow
	if job.WorkflowID != "" {
		result := core.ObjFind(job.WorkflowID)
		if result.Error != nil {
			core.Dart.Log.Warningf("While running workflow job, JobPackagingController could not find workflow with id %s", job.WorkflowID)
		} else {
			workflow = result.Workflow()
			job.PackageOp.BagItSerialization = workflow.Serialization
		}
	}

	data := gin.H{
		"job":                  job,
		"form":                 job.ToForm(),
		"pathSeparator":        string(os.PathSeparator),
		"baggingDir":           baggingDir,
		"autoSetSerialization": getSerlializationAutosets(),
		"helpUrl":              GetHelpUrl(c),
		"workflow":             workflow,
	}
	c.HTML(http.StatusOK, "job/packaging.html", data)
}

// POST /jobs/packaging/:id
func JobSavePackaging(c *gin.Context) {
	jobId := c.Param("id")
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/jobs/metadata/%s", jobId)
	if direction == "previous" {
		nextPage = fmt.Sprintf("/jobs/files/%s", jobId)
	}

	result := core.ObjFind(jobId)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()

	// See https://github.com/APTrust/dart/issues/568
	// This condition is extremely rare, but if we run into
	// others like it, we may want to fix the issue closer
	// to the root, in core.ObjFind(). We could force that
	// to add a PackageOp if one is missing, but that may
	// present new problems. For example, validation-only
	// and upload-only jobs should never have a PackageOp.
	// Keep an eye out for issues similar to the one above.
	if job.PackageOp == nil {
		core.Dart.Log.Warningf("Job %s has nil PackageOp. Reinitializing package operation.", job.ID)
		job.PackageOp = core.NewPackageOperation("", "", make([]string, 0))
	}

	job.PackageOp.BagItSerialization = c.PostForm("BagItSerialization")
	job.PackageOp.OutputPath = c.PostForm("OutputPath")
	job.PackageOp.PackageFormat = c.PostForm("PackageFormat")
	job.PackageOp.PackageName = c.PostForm("PackageName")

	bagItProfileID := c.PostForm("BagItProfileID")
	if bagItProfileID == "" {
		job.BagItProfile = nil
	} else if job.BagItProfile == nil || job.BagItProfile.ID != bagItProfileID {
		profileResult := core.ObjFind(bagItProfileID)
		if profileResult.Error != nil {
			err := fmt.Errorf("BagIt Profile: %s", profileResult.Error.Error())
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
		profile := profileResult.BagItProfile()
		if profile == nil {
			err := fmt.Errorf("BagIt Profile: object %s is not a BagIt profile", bagItProfileID)
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
		job.BagItProfile = profile
	}

	if job.ValidationOp == nil {
		job.ValidationOp = core.NewValidationOperation(job.PackageOp.OutputPath)
	} else {
		job.ValidationOp.PathToBag = job.PackageOp.OutputPath
	}

	if direction == "next" {
		ok := job.PackageOp.Validate()
		if !ok {
			// Errors from sub-object have sub-object prefix for
			// display when running jobs from command line. We
			// want to strip that prefix here.
			errors := make(map[string]string)
			for key, value := range job.PackageOp.Errors {
				fieldName := strings.Replace(key, "PackageOperation.", "", 1)
				errors[fieldName] = value
			}
			job.Errors = errors
			form := job.ToForm()
			data := gin.H{
				"job":           job,
				"form":          form,
				"pathSeparator": string(os.PathSeparator),
				"helpUrl":       GetHelpUrl(c),
			}
			c.HTML(http.StatusBadRequest, "job/packaging.html", data)
			return
		}
	}
	// If direction == "previous", just save and go back.
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		errorToDisplay := err
		// Fixes https://trello.com/c/4akB0rL9.
		// There is a reason we prevent duplicate job names, but unless we
		// explain it clearly to users, it looks like a bug. This fix makes
		// the explanation more clear. Someday, messages like this should go
		// into separate HTML templates and/or should be made easier to
		// internationalize.
		if err.Error() == constants.ErrUniqueConstraint.Error() {
			message := fmt.Sprintf(
				`DART cannot save this job because there is an existing job
				with the same name. DART job names must be unique because it's
				too confusing to users to have multiple bags with the same name
				and different contents. If you want to add files to the existing
				bag, add them to the older job named "%s". If you want to
				create a new bag, please rename this job to something other
				than "%s".`, job.Name(), job.Name())
			errorToDisplay = errors.New(message)
			core.Dart.Log.Errorf(
				`Caught unique constraint error on job name when attempting to save
				job "%s". Reporting more instructive error message to user.`, job.Name())
		}
		AbortWithErrorHTML(c, http.StatusInternalServerError, errorToDisplay)
		return
	}
	c.Redirect(http.StatusFound, nextPage)
}

func getSerlializationAutosets() map[string]string {
	autosetMap := make(map[string]string)
	// Typical installation has 3-10 profiles.
	result := core.ObjList(constants.TypeBagItProfile, "obj_name", 1000, 0)
	if result.Error != nil {
		core.Dart.Log.Warningf("Could not load BagIt profiles for serialization auto-set: %s", result.Error.Error())
		return autosetMap
	}
	for _, profile := range result.BagItProfiles {
		if profile.Serialization == constants.SerializationRequired && len(profile.AcceptSerialization) == 1 {
			autosetMap[profile.ID] = profile.AcceptSerialization[0]
		}
	}
	return autosetMap
}
