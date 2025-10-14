package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// GET /validation_jobs/new
func ValidationJobNew(c *gin.Context) {
	valJob := core.NewValidationJob()
	err := core.ObjSaveWithoutValidation(valJob)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/validation_jobs/files/%s", valJob.ID))
}

// GET /validation_jobs/files/:id
func ValidationJobShowFiles(c *gin.Context) {
	templateData, err := InitFileChooser(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}

	directory := c.Query("directory")
	if directory == "" {
		directory, _ = core.GetAppSetting(constants.BaggingDirectory)
	}
	items, err := GetDirList(directory)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	templateData["job"] = valJob
	templateData["items"] = items
	templateData["showJobFiles"] = len(valJob.PathsToValidate) > 0
	templateData["sourceFiles"] = valJob.PathsToValidate
	templateData["showJumpMenu"] = true

	templateData["dragDropInstructions"] = "Drag and drop the items from the left that you want to validate."
	templateData["fileDeletionUrl"] = fmt.Sprintf("/validation_jobs/delete_file/%s", valJob.ID)
	templateData["jobDeletionUrl"] = fmt.Sprintf("/validation_jobs/delete/%s", valJob.ID)
	templateData["nextButtonUrl"] = fmt.Sprintf("/validation_jobs/profiles/%s", valJob.ID)
	templateData["addFileUrl"] = fmt.Sprintf("/validation_jobs/add_file/%s", valJob.ID)

	c.HTML(http.StatusOK, "job/files.html", templateData)
}

// POST /validation_jobs/add_file/:id
func ValidationJobAddFile(c *gin.Context) {
	fileToAdd := c.PostForm("fullPath")
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	index := -1
	for i, filename := range valJob.PathsToValidate {
		if fileToAdd == filename {
			index = i
			break
		}
	}
	if index < 0 {
		valJob.PathsToValidate = append(valJob.PathsToValidate, fileToAdd)
		err := core.ObjSaveWithoutValidation(valJob)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/validation_jobs/files/%s?%s", valJob.ID, values.Encode()))
}

// POST /validation_jobs/delete_file/:id
func ValidationJobDeleteFile(c *gin.Context) {
	fileToDelete := c.PostForm("fullPath")
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	index := -1
	for i, filename := range valJob.PathsToValidate {
		if fileToDelete == filename {
			index = i
			break
		}
	}
	if index >= 0 {
		valJob.PathsToValidate = util.RemoveFromSlice[string](valJob.PathsToValidate, index)
		err := core.ObjSaveWithoutValidation(valJob)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/validation_jobs/files/%s?%s", valJob.ID, values.Encode()))
}

// GET /validation_jobs/profiles/:id
func ValidationJobShowProfiles(c *gin.Context) {
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	form := valJob.ToForm()
	data := gin.H{
		"form":    form,
		"valJob":  valJob,
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "validation_job/choose_profile.html", data)
}

// POST /validation_jobs/profiles/:id
func ValidationJobSaveProfile(c *gin.Context) {
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	valJob.BagItProfileID = c.PostForm("BagItProfileID")
	err = core.ObjSave(valJob)
	if err != nil {
		form := valJob.ToForm()
		data := gin.H{
			"form":    form,
			"valJob":  valJob,
			"helpUrl": GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "validate/choose_profile.html", data)
		return
	}

	// Go to next or previous page, as specified by user
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/validation_jobs/review/%s", valJob.ID)

	// If user wants to go back to the packaging page,
	// let them go. We don't need to display the errors
	// because they'll come back through this page again.
	if direction == "previous" {
		nextPage = fmt.Sprintf("/validation_jobs/files/%s", valJob.ID)
		c.Redirect(http.StatusFound, nextPage)
	}

	c.Redirect(http.StatusFound, nextPage)
}

// GET /validation_jobs/review/:id
func ValidationJobReview(c *gin.Context) {
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	result := core.ObjFind(valJob.BagItProfileID)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	jobSummary := core.NewValidationJobSummary(valJob, result.BagItProfile())
	jobSummaryJson, _ := json.MarshalIndent(jobSummary, "", "  ")

	data := gin.H{
		"jobID":          valJob.ID,
		"workflowID":     "-",
		"jobSummary":     jobSummary,
		"jobSummaryJson": string(jobSummaryJson),
		"jobRunUrl":      "/validation_jobs/run/",
		"backButtonUrl":  fmt.Sprintf("/validation_jobs/profiles/%s", valJob.ID),
		"helpUrl":        GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "job/run.html", data)
}

// GET /validation_jobs/run/:id
//
// By REST standards, this should be a POST. However, the Server
// Send Events standard for JavaScript only supports GET.
func ValidationJobRun(c *gin.Context) {
	valJob, err := loadValidationJob(c.Param("id"))
	if err != nil {
		detailedError := fmt.Errorf("ValidationJob record not found. %s", err.Error())
		AbortWithErrorHTML(c, http.StatusNotFound, detailedError)
		return
	}
	if !valJob.Validate() {
		validationErr := ""
		for _, msg := range valJob.Errors {
			validationErr += msg + " "
		}
		AbortWithErrorHTML(c, http.StatusBadRequest, fmt.Errorf("Job is invalid. %s", validationErr))
		return
	}

	result := core.ObjFind(valJob.BagItProfileID)
	if result.Error != nil {
		detailedError := fmt.Errorf("BagIt profile not found. %s", result.Error.Error())
		AbortWithErrorHTML(c, http.StatusNotFound, detailedError)
		return
	}
	profile := result.BagItProfile()

	messageChannel := make(chan *core.EventMessage)
	go func() {

		// Give the listeners below a chance to attach.
		time.Sleep(200 * time.Millisecond)

		// Send initialization data to the
		// front end, so it knows what to display.
		jobSummary := core.NewValidationJobSummary(valJob, profile)
		initEvent := core.InitEvent(jobSummary)
		messageChannel <- initEvent

		// Run the job and have it send status updates back to the
		// front end through the message channel.
		exitCode := valJob.Run(messageChannel)

		// When job completes, create the final disconnect event
		// to tell the front end to stop listening for server-sent
		// events. This is the last message we'll send.
		// When the front end gets this, it terminates
		// the server-sent event connection. The call to c.Stream() below
		// will return when the connection is terminated.
		status := constants.StatusFailed
		if exitCode == constants.ExitOK {
			status = constants.StatusSuccess
		}
		eventMessage := &core.EventMessage{
			EventType: constants.EventTypeDisconnect,
			Message:   fmt.Sprintf("Job completed with exit code %d (%s)", exitCode, status),
			Status:    status,
		}
		messageChannel <- eventMessage
	}()

	// While the job runner is pumping events into one end of
	// our message channel, we need a listener on the other end
	// to do something with those events. The streamer merely
	// receives events from the job runner and passes them out
	// to the client as server-sent events.
	streamer := func(w io.Writer) bool {
		if msg, ok := <-messageChannel; ok {
			c.SSEvent("message", msg)
			if msg.EventType != constants.EventTypeDisconnect {
				return true
			}
		}
		err := core.ObjSave(valJob)
		if err != nil {
			core.Dart.Log.Error("Error saving validation job %s after run: %v", valJob.ID, err)
		}
		return false
	}

	// At this point, we have a job running in a separate go routine,
	// and a streamer set up to pass job events along to the client.
	//
	// The last thing we need to do is attach the streamer to gin's
	// io.Writer, which is the pipe through which messages are written
	// to the client. The c.Stream() function keeps writing until the
	// remote client disconnects. Note that c.Stream() blocks until
	// the client disconnects.
	//
	// The client should disconnect when we send it the disconnect event.
	c.Stream(streamer)
	c.Writer.Flush()
	//fmt.Println("Job Execute: client disconnected.")
}

func loadValidationJob(valJobID string) (*core.ValidationJob, error) {
	result := core.ObjFind(valJobID)
	return result.ValidationJob(), result.Error
}
