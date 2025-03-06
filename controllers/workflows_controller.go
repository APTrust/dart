package controllers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /workflow/new
func WorkflowNew(c *gin.Context) {
	workflow := &core.Workflow{
		ID:            uuid.NewString(),
		Name:          "New Workflow",
		PackageFormat: constants.PackageFormatBagIt,
	}
	err := core.ObjSaveWithoutValidation(workflow)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := gin.H{
		"form":                 workflow.ToForm(),
		"suppressDeleteButton": false,
		"helpUrl":              GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "workflow/form.html", data)
}

// WorkflowCreateFromJob creates a new Workflow.
// Handles submission of new Workflow form.
// POST /workflows/from_job/:jobId
func WorkflowCreateFromJob(c *gin.Context) {
	jobId := c.Param("jobId")
	result := core.ObjFind(jobId)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	workflow, err := core.WorkFlowFromJob(result.Job())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	err = core.ObjSave(workflow)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/workflows/edit/%s", workflow.ID),
	}
	c.JSON(http.StatusCreated, data)
}

// PUT /workflows/delete/:id
// POST /workflows/delete/:id
func WorkflowDelete(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	err := core.ObjDelete(result.Workflow())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted workflow %s", result.Workflow().Name))
	c.Redirect(http.StatusFound, "/workflows")
}

// GET /workflows/edit/:id
func WorkflowEdit(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	c.HTML(http.StatusOK, "workflow/form.html", request.TemplateData)
}

// GET /workflows
func WorkflowIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.Workflows
	c.HTML(http.StatusOK, "workflow/list.html", request.TemplateData)
}

// PUT /workflows/edit/:id
// POST /workflows/edit/:id
func WorkflowSave(c *gin.Context) {
	workflow := &core.Workflow{}
	err := c.Bind(workflow)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	workflow.ID = c.Param("id")
	profileID := c.PostForm("BagItProfileID")
	if util.LooksLikeUUID(profileID) {
		result := core.ObjFind(profileID)
		if result.Error == nil && result.BagItProfile() != nil {
			workflow.BagItProfile = result.BagItProfile()
		}
	}
	err = core.ObjSave(workflow)
	if err != nil {
		objectExistsInDB, _ := core.ObjExists(workflow.ID)
		data := gin.H{
			"form":             workflow.ToForm(),
			"objectExistsInDB": objectExistsInDB,
			"helpUrl":          GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "workflow/form.html", data)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Saved workflow %s", workflow.Name))
	c.Redirect(http.StatusFound, "/workflows")
}

// GET /workflows/export/:id
func WorkflowExport(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	workflow := result.Workflow()
	workflowJson, err := workflow.ExportJson()
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	passwordWarningDisplay := "none"
	if workflow.HasPlaintextPasswords() {
		passwordWarningDisplay = "block"
	}
	data := gin.H{
		"json":                   string(workflowJson),
		"passwordWarningDisplay": passwordWarningDisplay,
		"helpUrl":                GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/export_result.html", data)
}

// POST /workflows/run/:id
func WorkflowRun(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := core.JobFromWorkflow(result.Workflow())
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/jobs/files/%s", job.ID),
	}
	c.JSON(http.StatusOK, data)
}

// GET /workflows/batch/choose
func WorkflowShowBatchForm(c *gin.Context) {
	wb := &core.WorkflowBatch{}
	form := wb.ToForm()

	// Create a dummy dummyJob here, so the divs display on the
	// front end. If the worklflow has a packaging step, dummy dummyJob
	// should have a PacakageOp. Ditto for the workflow's upload ops.
	dummyJob := core.NewJob()
	dummyUploadOp := &core.UploadOperation{StorageService: core.NewStorageService()}
	dummyJob.UploadOps = []*core.UploadOperation{dummyUploadOp}
	dummyJob.PackageOp.PackageFormat = constants.PackageFormatBagIt

	data := gin.H{
		"form":    form,
		"job":     dummyJob,
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "workflow/batch.html", data)
}

// POST /workflows/batch/validate
func WorkflowBatchValidate(c *gin.Context) {
	workflowID := c.PostForm("WorkflowID")
	csvFileHeader, err := c.FormFile("CsvUpload")
	if err != nil {
		// User didn't choose a CSV file.
		// Error handling here differs from our usual pattern only
		// because this is a file upload input instead of a regular
		// form input.
		data := gin.H{}
		data["errors"] = map[string]string{
			"WorkflowBatch_CsvUpload": "Please choose a CSV file containing batch information",
		}
		c.JSON(http.StatusBadRequest, data)
		return
	}

	tempFile := filepath.Join(os.TempDir(), csvFileHeader.Filename)
	err = c.SaveUploadedFile(csvFileHeader, tempFile)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, err)
		return
	}

	workflow := core.ObjFind(workflowID).Workflow() // may be nil if workflowID is empty
	wb := core.NewWorkflowBatch(workflow, tempFile)
	status := http.StatusOK
	data := gin.H{}
	if !wb.Validate() {
		status = http.StatusBadRequest
		data["errors"] = wb.Errors
	} else {
		queryParams := url.Values{}
		queryParams.Set("WorkflowID", workflowID)
		queryParams.Set("PathToCSVFile", tempFile)
		data["location"] = fmt.Sprintf("/workflows/batch/run?%s", queryParams.Encode())
	}
	data["status"] = status
	c.JSON(status, data)
}

// GET /workflows/batch/run
func WorkflowRunBatch(c *gin.Context) {
	workflowID := c.Query("WorkflowID")
	pathToCSVFile := c.Query("PathToCSVFile")
	workflow := core.ObjFind(workflowID).Workflow()
	wb := core.NewWorkflowBatch(workflow, pathToCSVFile)
	if !wb.Validate() {
		errMsg := ""
		for _, message := range wb.Errors {
			errMsg += message + "; "
		}
		AbortWithErrorJSON(c, http.StatusInternalServerError, fmt.Errorf("workflow has validation errors: %s", errMsg))
		return
	}
	parser := core.NewCSVBatchParser(wb.PathToCSVFile, wb.Workflow)
	outputDir, err := core.GetAppSetting(constants.BaggingDirectory)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, fmt.Errorf("Cannot find application setting for 'Bagging Directory'"))
		return
	}

	jobParamsArray, err := parser.ParseAll(outputDir)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, fmt.Errorf("Error parsing CSV batch file: %s", err.Error()))
		return
	}

	messageChannel := make(chan *core.EventMessage)

	go func() {
		allJobsSucceeded := true
		for _, jobParams := range jobParamsArray {
			// TODO: Close message channel only after ALL parts of job (including ALL uploads) complete.
			//defer close(messageChannel)

			job := jobParams.ToJob()
			job.UpdatePayloadStats()

			// First things first. Send initialization data to the
			// front end, so it knows what to display.
			jobSummary := core.NewJobSummary(job)
			initEvent := core.InitEvent(jobSummary)
			messageChannel <- initEvent

			// core.RunJobWithMessageChannel will run the entire job,
			// pumping messages through the message channel as it goes.
			// It will not return until it's done. An exit code of zero
			// indicates success. See constants.go for the meanings of
			// other exit codes.
			exitCode := core.RunJobWithMessageChannel(job, false, messageChannel)

			// At this point, the job has completed, and we need to create
			// the final disconnect event to tell the front end to stop
			// listening for server-sent events. This is the last message
			// we'll send. When the front end gets this, it terminates
			// the server-sent event connection. The call to c.Stream() below
			// will return when the connection is terminated.
			status := constants.StatusFailed
			if exitCode == constants.ExitOK {
				status = constants.StatusSuccess
			}
			jobResult := core.NewJobResult(job)
			eventMessage := &core.EventMessage{
				EventType: constants.EventTypeFinish,
				Message:   fmt.Sprintf("Job completed with exit code %d", exitCode),
				Status:    status,
				JobResult: jobResult,
			}
			messageChannel <- eventMessage
			if status == constants.StatusFailed {
				allJobsSucceeded = false
			}
		}
		status := constants.StatusSuccess
		if !allJobsSucceeded {
			status = constants.StatusFailed
		}

		// Delete the temp copy of the uploaded CSV file
		err = os.Remove(wb.PathToCSVFile)
		if err != nil {
			core.Dart.Log.Warningf("Error deleting temp copy of CSV batch file '%s': %s", wb.PathToCSVFile, err.Error())
		} else {
			core.Dart.Log.Info("Deleted temp copy of CSV batch file.")
		}

		// Send finish message to indicate batch completed.
		eventMessage := &core.EventMessage{
			EventType: constants.EventTypeBatchCompleted,
			Message:   "Batch completed",
			Status:    status,
		}
		messageChannel <- eventMessage

		// Send disconnect telling front end to hang up.
		eventMessage = &core.EventMessage{
			EventType: constants.EventTypeDisconnect,
			Message:   "All jobs complete. Disconnect now.",
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
		// err := core.ObjSave(job)
		// if err != nil {
		// 	core.Dart.Log.Error("Error saving job %s after run: %v", job.ID, err)
		// }
		return false
	}

	// Building a small bag can take just milliseconds. In testing,
	// the front-end client (JavaScript EventSource) starts receiving data
	// in the millisecond window between connecting and defining event
	// handlers. That causes the front end to miss the first event.
	// We could handle this with Last-Event-ID, but that gets tricky
	// if we have to cache and re-request data. This is much simpler.
	// Just give the front-end time to attach its event handler.
	time.Sleep(200 * time.Millisecond)

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
	fmt.Println("Job Execute: client disconnected.")

	// TODO:
	//
	// Parse CSV file
	// Convert each line to jobParams
	// Convert each jobParams to job
	// In event emitter go routine, execute each job
	// Save job outcome?
	// Save job artifacts?
	// Be sure the disconnect event is not emitted until all jobs are complete
	//
	// See job_run_controller.go for details on the emitter.
}
