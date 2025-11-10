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

// GET /upload_jobs/new
func UploadJobNew(c *gin.Context) {
	uploadJob := core.NewUploadJob()
	err := core.ObjSaveWithoutValidation(uploadJob)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/upload_jobs/files/%s", uploadJob.ID))

}

// GET /upload_jobs/files/:id
func UploadJobShowFiles(c *gin.Context) {
	templateData, err := InitFileChooser(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	uploadJob, err := loadUploadJob(c.Param("id"))
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
	templateData["job"] = uploadJob
	templateData["items"] = items
	templateData["showJobFiles"] = len(uploadJob.PathsToUpload) > 0
	templateData["sourceFiles"] = uploadJob.PathsToUpload
	templateData["showJumpMenu"] = true

	templateData["dragDropInstructions"] = "Drag and drop the items from the left that you want to upload."
	templateData["fileDeletionUrl"] = fmt.Sprintf("/upload_jobs/delete_file/%s", uploadJob.ID)
	templateData["jobDeletionUrl"] = fmt.Sprintf("/upload_jobs/delete/%s", uploadJob.ID)
	templateData["nextButtonUrl"] = fmt.Sprintf("/upload_jobs/targets/%s", uploadJob.ID)
	templateData["addFileUrl"] = fmt.Sprintf("/upload_jobs/add_file/%s", uploadJob.ID)
	templateData["helpUrl"] = GetHelpUrl(c)

	c.HTML(http.StatusOK, "job/files.html", templateData)

}

// POST /upload_jobs/add_file/:id
func UploadJobAddFile(c *gin.Context) {
	fileToAdd := c.PostForm("fullPath")
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	index := -1
	for i, filename := range uploadJob.PathsToUpload {
		if fileToAdd == filename {
			index = i
			break
		}
	}
	if index < 0 {
		uploadJob.PathsToUpload = append(uploadJob.PathsToUpload, fileToAdd)
		err := core.ObjSaveWithoutValidation(uploadJob)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/upload_jobs/files/%s?%s", uploadJob.ID, values.Encode()))
}

// POST /upload_jobs/delete_file/:id
func UploadJobDeleteFile(c *gin.Context) {
	fileToDelete := c.PostForm("fullPath")
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	index := -1
	for i, filename := range uploadJob.PathsToUpload {
		if fileToDelete == filename {
			index = i
			break
		}
	}
	if index >= 0 {
		uploadJob.PathsToUpload = util.RemoveFromSlice[string](uploadJob.PathsToUpload, index)
		err := core.ObjSaveWithoutValidation(uploadJob)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/upload_jobs/files/%s?%s", uploadJob.ID, values.Encode()))
}

// GET /upload_jobs/targets/:id
func UploadJobShowTargets(c *gin.Context) {
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	form := uploadJob.ToForm()
	data := gin.H{
		"form":      form,
		"uploadJob": uploadJob,
		"helpUrl":   GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "upload_job/choose_targets.html", data)
}

// POST /upload_jobs/targets/:id
func UploadJobSaveTarget(c *gin.Context) {
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	uploadJob.StorageServiceIDs = c.PostFormArray("StorageServiceIDs")
	uploadJob.UploadOps = make([]*core.UploadOperation, len(uploadJob.StorageServiceIDs))
	for i, ssid := range uploadJob.StorageServiceIDs {
		result := core.ObjFind(ssid)
		if result.Error != nil {
			core.Dart.Log.Errorf("In UploadJobController.UploadJobSaveTarget, storage service not found: %s", ssid)
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
		uploadJob.UploadOps[i] = core.NewUploadOperation(result.StorageService(), uploadJob.PathsToUpload)
	}
	err = core.ObjSave(uploadJob)
	if err != nil {
		form := uploadJob.ToForm()
		data := gin.H{
			"form":      form,
			"uploadJob": uploadJob,
			"helpUrl":   GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "upload_job/choose_targets.html", data)
		return
	}

	// Go to next or previous page, as specified by user
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/upload_jobs/review/%s", uploadJob.ID)

	// If user wants to go back to the packaging page,
	// let them go. We don't need to display the errors
	// because they'll come back through this page again.
	if direction == "previous" {
		nextPage = fmt.Sprintf("/upload_jobs/files/%s", uploadJob.ID)
		c.Redirect(http.StatusFound, nextPage)
	}

	c.Redirect(http.StatusFound, nextPage)
}

// GET /upload_jobs/review/:id
func UploadJobReview(c *gin.Context) {
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	jobSummary := core.NewUploadJobSummary(uploadJob)
	jobSummaryJson, _ := json.MarshalIndent(jobSummary, "", "  ")

	data := gin.H{
		"jobID":          uploadJob.ID,
		"workflowID":     "-",
		"jobSummary":     jobSummary,
		"jobSummaryJson": string(jobSummaryJson),
		"jobRunUrl":      "/upload_jobs/run/",
		"backButtonUrl":  fmt.Sprintf("/upload_jobs/targets/%s", uploadJob.ID),
		"helpUrl":        GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "job/run.html", data)
}

// GET /upload_jobs/run/:id
//
// By REST standards, this should be a POST. However, the Server
// Send Events standard for JavaScript only supports GET.
func UploadJobRun(c *gin.Context) {
	uploadJob, err := loadUploadJob(c.Param("id"))
	if err != nil {
		detailedError := fmt.Errorf("UploadJob record not found. %s", err.Error())
		AbortWithErrorHTML(c, http.StatusNotFound, detailedError)
		return
	}
	if !uploadJob.Validate() {
		validationErr := ""
		for _, msg := range uploadJob.Errors {
			validationErr += msg + " "
		}
		AbortWithErrorHTML(c, http.StatusBadRequest, fmt.Errorf("Job is invalid. %s", validationErr))
		return
	}

	messageChannel := make(chan *core.EventMessage)
	go func() {

		// Give the listeners below a chance to attach.
		time.Sleep(200 * time.Millisecond)

		// Send initialization data to the
		// front end, so it knows what to display.
		jobSummary := core.NewUploadJobSummary(uploadJob)
		initEvent := core.InitEvent(jobSummary)
		messageChannel <- initEvent

		// Run the job and have it send status updates back to the
		// front end through the message channel.
		exitCode := uploadJob.Run(messageChannel)

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
		err := core.ObjSave(uploadJob)
		if err != nil {
			core.Dart.Log.Error("Error saving upload job %s after run: %v", uploadJob.ID, err)
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

func loadUploadJob(uploadJobID string) (*core.UploadJob, error) {
	result := core.ObjFind(uploadJobID)
	return result.UploadJob(), result.Error
}
