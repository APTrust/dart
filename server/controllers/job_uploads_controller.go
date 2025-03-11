package controllers

import (
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// GET /jobs/upload/:id
func JobShowUpload(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	form, err := GetUploadTargetsForm(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	var workflow *core.Workflow
	if job.WorkflowID != "" {
		result := core.ObjFind(job.WorkflowID)
		if result.Error != nil {
			core.Dart.Log.Warningf("While running workflow job, JobMetadataController could not find workflow with id %s", job.WorkflowID)
		} else {
			workflow = result.Workflow()
		}
	}

	data := gin.H{
		"job":      job,
		"form":     form,
		"helpUrl":  GetHelpUrl(c),
		"workflow": workflow,
	}
	c.HTML(http.StatusOK, "job/uploads.html", data)
}

// POST /jobs/upload/:id
func JobSaveUpload(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	uploadTargets := c.PostFormArray("UploadTargets")
	job.UploadOps = make([]*core.UploadOperation, len(uploadTargets))
	for i, targetID := range uploadTargets {
		ssResult := core.ObjFind(targetID)
		if ssResult.Error != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, ssResult.Error)
			return
		}
		job.UploadOps[i] = core.NewUploadOperation(ssResult.StorageService(), []string{job.PackageOp.OutputPath})
	}

	//
	// TODO: Save WITH validation?
	//       We may want to validate here and
	//       show errors in the flash bar before
	//       letting user move on to the Run page.
	//
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/jobs/summary/%s", job.ID)
	if direction == "previous" {
		nextPage = fmt.Sprintf("/jobs/metadata/%s", job.ID)
	}
	c.Redirect(http.StatusFound, nextPage)
}

func GetUploadTargetsForm(job *core.Job) (*core.Form, error) {
	selectedTargets := AlreadySelectedTargets(job)
	form := core.NewForm("", "", nil)
	targetsField := form.AddMultiValueField("UploadTargets", "Upload Targets", selectedTargets, false)
	targetChoices, err := GetAvailableUploadTargets(selectedTargets)
	if err != nil {
		return nil, err
	}
	targetsField.Choices = targetChoices
	return form, nil
}

func GetAvailableUploadTargets(selectedTargets []string) ([]core.Choice, error) {
	result := core.ObjList(constants.TypeStorageService, "obj_name", 1000, 0)
	if result.Error != nil {
		return nil, result.Error
	}
	targets := make([]core.Choice, 0)
	for _, ss := range result.StorageServices {
		isValid := ss.Validate()
		if !isValid {
			core.Dart.Log.Warningf("Omitting storage service '%s' from upload targets due to validation errors: %v", ss.Name, ss.Errors)
			continue
		}
		if !ss.AllowsUpload {
			core.Dart.Log.Warningf("Omitting storage service '%s' from upload targets because it does not allow uploads", ss.Name)
		} else {
			choice := core.Choice{
				Label:    ss.Name,
				Value:    ss.ID,
				Selected: util.StringListContains(selectedTargets, ss.ID),
			}
			targets = append(targets, choice)
		}
	}
	return targets, nil
}

func AlreadySelectedTargets(job *core.Job) []string {
	selected := make([]string, 0)
	for _, uploadOp := range job.UploadOps {
		if uploadOp.StorageService != nil {
			selected = append(selected, uploadOp.StorageService.ID)
		}
	}
	return selected
}
