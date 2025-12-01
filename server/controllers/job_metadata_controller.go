package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// This struct holds all the tag form inputs for a tag file.
// This is used on the metadata page.
type TagFileForms struct {
	Name   string
	Fields []*core.Field
}

// GET /jobs/metadata/:id
func JobShowMetadata(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	tagFiles := GetTagFileForms(job, false)

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
		"form":     job.ToForm(),
		"tagFiles": tagFiles,
		"helpUrl":  GetHelpUrl(c),
		"workflow": workflow,
	}
	c.HTML(http.StatusOK, "job/metadata.html", data)
}

// POST /jobs/metadata/:id
func JobSaveMetadata(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	for _, tagDef := range job.BagItProfile.Tags {
		tagDef.UserValue = c.PostForm(tagDef.FullyQualifiedName())
	}
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	// Go to next or previous page, as specified by user
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/jobs/upload/%s", job.ID)

	// When running a workflow, the upload targets are pre-defined
	// and generally should not be changed. In this case, skip
	// the uploads page and go right to the run page.
	if job.WorkflowID != "" {
		nextPage = fmt.Sprintf("/jobs/summary/%s", job.ID)
	}

	// If user wants to go back to the packaging page,
	// let them go. We don't need to display the errors
	// because they'll come back through this page again.
	if direction == "previous" {
		nextPage = fmt.Sprintf("/jobs/packaging/%s", job.ID)
		c.Redirect(http.StatusFound, nextPage)
	}
	if TagErrorsExist(job.BagItProfile.Tags) && direction == "next" {
		tagFiles := GetTagFileForms(job, true)
		data := gin.H{
			"job":      job,
			"form":     job.ToForm(),
			"tagFiles": tagFiles,
			"helpUrl":  GetHelpUrl(c),
		}
		c.HTML(http.StatusOK, "job/metadata.html", data)
	}
	c.Redirect(http.StatusFound, nextPage)
}

// GET /jobs/add_tag/:id
func JobAddTag(c *gin.Context) {
	tagDef := core.TagDefinition{
		ID:             uuid.NewString(),
		IsBuiltIn:      false,
		IsUserAddedTag: true,
		WasAddedForJob: true,
	}
	form := tagDef.ToForm()
	data := gin.H{
		"jobID":   c.Param("id"),
		"form":    form,
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "job/new_tag.html", data)
}

// POST /jobs/add_tag/:id
func JobSaveTag(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorJSON(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	tagDef := &core.TagDefinition{}
	err := c.ShouldBind(tagDef)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusBadRequest, err)
		return
	}
	if !tagDef.Validate() {
		form := tagDef.ToForm()
		data := gin.H{
			"jobID": c.Param("id"),
			"form":  form,
		}
		c.HTML(http.StatusBadRequest, "job/new_tag.html", data)
		return
	}
	tagDef.IsBuiltIn = false
	tagDef.IsUserAddedTag = true
	tagDef.WasAddedForJob = true
	job.BagItProfile.Tags = append(job.BagItProfile.Tags, tagDef)
	job.BagItProfile.FlagUserAddedTagFiles()
	err = core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, err)
		return
	}

	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/jobs/metadata/%s", job.ID),
	}
	c.JSON(http.StatusOK, data)
}

// POST /jobs/delete_tag/:id
func JobDeleteTag(c *gin.Context) {
	tagId := c.PostForm("tagId")
	if !util.LooksLikeUUID(tagId) {
		AbortWithErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Missing or invalid tag id."))
		return
	}
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorJSON(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	tags := make([]*core.TagDefinition, 0)
	for _, tagDef := range job.BagItProfile.Tags {
		if tagDef.ID != tagId {
			tags = append(tags, tagDef)
		}
	}
	job.BagItProfile.Tags = tags
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, err)
		return
	}
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/jobs/metadata/%s", job.ID),
	}
	c.JSON(http.StatusOK, data)
}

func GetTagFileForms(job *core.Job, withErrors bool) []TagFileForms {
	// Get the list of tag files, in alpha order.
	tagFileNames := job.BagItProfile.TagFileNames()
	tagFiles := make([]TagFileForms, len(tagFileNames))
	for i, tagFileName := range tagFileNames {
		// Get list of tags in this file, in alpha order
		tagDefs := job.BagItProfile.TagsInFile(tagFileName)
		metadataTagFile := TagFileForms{
			Name:   tagFileName,
			Fields: make([]*core.Field, len(tagDefs)),
		}
		for j, tagDef := range tagDefs {
			formGroupClass := ""
			if ShouldHideTag(tagDef) {
				formGroupClass = "form-group-hidden"
			}
			field := &core.Field{
				Attrs:          make(map[string]string),
				ID:             tagDef.ID,
				Name:           tagDef.FullyQualifiedName(),
				Label:          tagDef.TagName,
				Value:          tagDef.GetValue(),
				Choices:        core.MakeChoiceList(tagDef.Values, tagDef.GetValue()),
				Required:       tagDef.Required,
				Help:           tagDef.Help,
				FormGroupClass: formGroupClass,
			}
			if withErrors {
				field.Error = ValidateTagValue(tagDef)
			}
			if strings.Contains(strings.ToLower(tagDef.TagName), "description") {
				field.Attrs["ControlType"] = "textarea"
			}
			if tagDef.WasAddedForJob {
				field.Attrs["data-was-added-for-job"] = "true"
			}
			if tagDef.IsUserAddedTag {
				field.Attrs["data-is-user-added-tag"] = "true"
			}
			if tagDef.IsUserAddedFile {
				field.Attrs["data-is-user-added-file"] = "true"
			}
			if tagDef.SystemMustSet() {
				field.Attrs["readonly"] = "readonly"
			}
			metadataTagFile.Fields[j] = field
		}
		tagFiles[i] = metadataTagFile
	}
	return tagFiles
}

// ShouldHideTag returns true if we should hide this tag by default
// on the Job Metadata page. User can choose to unhide it using the
// "Show All Tags" button.
//
// We hide tags if they have a default value, or if the system must
// set their value. One exception is the APTrust Storage-Option tag,
// which shows even if a default is set.
func ShouldHideTag(tagDef *core.TagDefinition) bool {
	if tagDef.TagFile == "aptrust-info.txt" && tagDef.TagName == "Storage-Option" {
		return false
	}
	return tagDef.SystemMustSet() || !util.IsEmpty(tagDef.DefaultValue)
}

func ValidateTagValue(tagDef *core.TagDefinition) string {
	tagValue := tagDef.GetValue()
	if !tagDef.IsLegalValue(tagValue) {
		return fmt.Sprintf("Tag has illegal value '%s'. Allowed values are: %s", tagValue, strings.Join(tagDef.Values, ","))
	}
	if tagDef.Required && !tagDef.EmptyOK && util.IsEmpty(tagValue) && !tagDef.SystemMustSet() {
		return "This tag requires a value."
	}
	return ""
}

func TagErrorsExist(tags []*core.TagDefinition) bool {
	for _, tagDef := range tags {
		if ValidateTagValue(tagDef) != "" {
			return true
		}
	}
	return false
}
