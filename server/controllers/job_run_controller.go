package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// GET /jobs/summary/:id
func JobRunShow(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	job.UpdatePayloadStats()
	jobSummary := core.NewJobSummary(job)
	jobSummaryJson, _ := json.MarshalIndent(jobSummary, "", "  ")

	var workflow *core.Workflow
	if job.WorkflowID != "" {
		result := core.ObjFind(job.WorkflowID)
		if result.Error != nil {
			core.Dart.Log.Warningf("While running workflow job, JobMetadataController could not find workflow with id %s", job.WorkflowID)
		} else {
			workflow = result.Workflow()
		}
	}

	// For most jobs, back button should go to the uploads page
	// so user can choose upload targets. For workflows, the upload
	// targets are already defined, so we want to skip the uploads
	// page and go back to the metadata page.
	backButtonUrl := fmt.Sprintf("/jobs/upload/%s", job.ID)
	if job.WorkflowID != "" {
		backButtonUrl = fmt.Sprintf("/jobs/metadata/%s", job.ID)
	}

	data := gin.H{
		"jobID":          job.ID,
		"workflowID":     job.WorkflowID,
		"jobSummary":     jobSummary,
		"jobSummaryJson": string(jobSummaryJson),
		"jobRunUrl":      "/jobs/run",
		"backButtonUrl":  backButtonUrl,
		"helpUrl":        GetHelpUrl(c),
		"workflow":       workflow,
		"staleBagExists": StaleUnserializedBagExists(job),
	}
	c.HTML(http.StatusOK, "job/run.html", data)
}

// GET /jobs/run/:id
//
// By REST standards, this should be a POST. However, the Server
// Sent Events standard for JavaScript only supports GET, so GET
// it is.
func JobRunExecute(c *gin.Context) {
	// Run the job in response to user clicking the Run button.
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	job.ClearErrors()
	job.UpdatePayloadStats()

	// See the comments above DeleteStaleUnserializedBag for why we
	// have to do this. Note that the front end asks the user to
	// confirm that this deletion is okay. If we reach this point in
	// the code, the user has said it's okay to delete the old version
	// of the bag
	DeleteStaleUnserializedBag(job)

	// The subcomponents of core.RunJob handle packaging,
	// validation and uploading. These components will push
	// event messages into the message channel, and the call
	// to c.SSEvent below pushes them out to the client as
	// server-sent events.
	//
	// A JavaScript listener on the client displays the messages
	// as they come in, and it adjusts the progress bars on
	// the "job run" page.
	messageChannel := make(chan *core.EventMessage)
	go func() {

		// TODO: Close message channel only after ALL parts of job (including ALL uploads) complete.

		// defer close(messageChannel)

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
		err := core.ObjSave(job)
		if err != nil {
			core.Dart.Log.Error("Error saving job %s after run: %v", job.ID, err)
		}
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
	//fmt.Println("Job Execute: client disconnected.")
}

// StaleUnserializedBagExists returns true if a version of the bag
// that the job object wants to create already exists in the bagging
// directory.
func StaleUnserializedBagExists(job *core.Job) bool {
	exists := false
	if job.PackageOp.BagItSerialization == "" || job.PackageOp.BagItSerialization == constants.SerialFormatNone {
		exists = util.FileExists(job.PackageOp.OutputPath)
		if exists {
			core.Dart.Log.Warningf("Stale version of unserialized bag at %s should be deleted", job.PackageOp.OutputPath)
		}
	}
	return exists
}

// DeleteStaleUnserializedBag deletes a stale version of an unserielized bag
// from the bagging directory. We do this to prevent the following case:
//
// 1. User creates version one of unserialized bag.
//
// 2. User changes the contents of the bag and creates version two.
//
//  3. Bag validation fails because manifest says the bag should contain
//     only the version two files, but it actually contains all version
//     two files, plus remnants of version one files.
func DeleteStaleUnserializedBag(job *core.Job) error {
	var err error
	staleBagExists := util.FileExists(job.PackageOp.OutputPath)
	isUnserialized := job.PackageOp.BagItSerialization == "" || job.PackageOp.BagItSerialization == constants.SerialFormatNone
	looksSafeToDelete := util.LooksSafeToDelete(job.PackageOp.OutputPath, 6, 2)
	if staleBagExists && isUnserialized && looksSafeToDelete {
		err = os.RemoveAll(job.PackageOp.OutputPath)
		if err != nil {
			core.Dart.Log.Infof("Deleted stale version of unserialized bag at %s", job.PackageOp.OutputPath)
		} else {
			core.Dart.Log.Errorf("Failed to delete stale version of unserialized bag at %s: %w", job.PackageOp.OutputPath, err)
		}
	}
	return err
}
