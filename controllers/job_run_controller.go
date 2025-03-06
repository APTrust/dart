package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
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

	data := gin.H{
		"jobID":          job.ID,
		"workflowID":     job.WorkflowID,
		"jobSummary":     jobSummary,
		"jobSummaryJson": string(jobSummaryJson),
		"jobRunUrl":      "/jobs/run",
		"backButtonUrl":  fmt.Sprintf("/jobs/upload/%s", job.ID),
		"helpUrl":        GetHelpUrl(c),
		"workflow":       workflow,
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
