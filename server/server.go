package server

import (
	"fmt"
	"io"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/gin-gonic/gin"
)

// Run runs the Registry application. This is called from main() to start
// the app. Listen on 127.0.0.1, not on 0.0.0.0 because we don't want to
// accept outside connections.
func Run(port int, quietMode bool) {
	if port < 1 {
		port = 8444
	}
	core.Dart.RuntimeMode = constants.ModeDartGUI
	r := InitAppEngine(quietMode)
	r.Run(fmt.Sprintf("127.0.0.1:%d", port))
}

// SetVersion passes the build version into the core namespace, so
// other parts of the app have access to it. This value is passed in
// at build time by the go build command.
func SetVersion(version string) {
	constants.Version = version
}

// InitAppEngine sets up the whole Gin application, loading templates and
// middleware and defining routes. The test suite can use this to get an
// instance of the Gin engine to bind to.
//
// Set param quietMode during unit/integration tests to suppress
// Gin's STDOUT logging. Those log statements are useful in development,
// but can be verbose and clutter the test output.
func InitAppEngine(quietMode bool) *gin.Engine {
	var r *gin.Engine
	if quietMode {
		// TODO: Resolve this. Should be debug mode in devel, release mode otherwise.
		// gin.SetMode(gin.ReleaseMode)
		gin.SetMode(gin.DebugMode)
		r = gin.New()
		r.Use(gin.Recovery())
		gin.DefaultWriter = io.Discard
	} else {
		r = gin.Default()
	}
	initTemplates(r)
	initRoutes(r)
	return r
}

func initRoutes(router *gin.Engine) {

	// This ensures that routes match even when they contain
	// extraneous slashes.
	router.RedirectFixedPath = true

	// Serve static assets from local file system in dev mode
	// or from embedded file system in realease build.
	initStaticRoutes(router)

	// Dashboard
	router.GET("/", controllers.DashboardShow)
	router.GET("/dashboard/report", controllers.DashboardGetReport)

	// About
	router.GET("/about", controllers.AboutShow)
	router.GET("/open_external", controllers.OpenExternalUrl)
	router.GET("/open_log", controllers.OpenLog)
	router.GET("/open_log_folder", controllers.OpenLogFolder)
	router.GET("/open_data_folder", controllers.OpenDataFolder)

	// App Settings
	router.GET("/app_settings", controllers.AppSettingIndex)
	router.GET("/app_settings/new", controllers.AppSettingNew)
	router.POST("/app_settings/new", controllers.AppSettingSave)
	router.GET("/app_settings/edit/:id", controllers.AppSettingEdit)
	router.PUT("/app_settings/edit/:id", controllers.AppSettingSave)
	router.POST("/app_settings/edit/:id", controllers.AppSettingSave)
	router.DELETE("/app_settings/delete/:id", controllers.AppSettingDelete)
	router.POST("/app_settings/delete/:id", controllers.AppSettingDelete)

	// BagIt Profiles
	router.GET("/profiles", controllers.BagItProfileIndex)
	router.GET("/profiles/new", controllers.BagItProfileNew)
	router.POST("/profiles/new", controllers.BagItProfileCreate)
	router.GET("/profiles/edit/:id", controllers.BagItProfileEdit)
	router.PUT("/profiles/edit/:id", controllers.BagItProfileSave)
	router.POST("/profiles/edit/:id", controllers.BagItProfileSave)
	router.PUT("/profiles/delete/:id", controllers.BagItProfileDelete)
	router.POST("/profiles/delete/:id", controllers.BagItProfileDelete)
	router.GET("/profiles/import", controllers.BagItProfileImportStart)
	router.POST("/profiles/import", controllers.BagItProfileImport)
	router.GET("/profiles/export/:id", controllers.BagItProfileExport)

	// BagIt Profile Tags & Tag Files
	router.GET("/profiles/new_tag/:profile_id/:tag_file", controllers.BagItProfileNewTag)
	router.GET("/profiles/edit_tag/:profile_id/:tag_id", controllers.BagItProfileEditTag)
	router.PUT("/profiles/edit_tag/:profile_id/:tag_id", controllers.BagItProfileSaveTag)
	router.POST("/profiles/edit_tag/:profile_id/:tag_id", controllers.BagItProfileSaveTag)
	router.POST("/profiles/delete_tag/:profile_id/:tag_id", controllers.BagItProfileDeleteTag)
	router.PUT("/profiles/delete_tag/:profile_id/:tag_id", controllers.BagItProfileDeleteTag)
	router.GET("/profiles/new_tag_file/:profile_id", controllers.BagItProfileNewTagFile)
	router.POST("/profiles/new_tag_file/:profile_id", controllers.BagItProfileCreateTagFile)
	router.POST("/profiles/delete_tag_file/:profile_id", controllers.BagItProfileDeleteTagFile)
	router.PUT("/profiles/delete_tag_file/:profile_id", controllers.BagItProfileDeleteTagFile)

	// Internal Settings
	router.GET("/internal_settings", controllers.InternalSettingIndex)

	// Jobs
	router.GET("/jobs", controllers.JobIndex)
	router.GET("/jobs/new", controllers.JobNew)
	router.PUT("/jobs/delete/:id", controllers.JobDelete)
	router.POST("/jobs/delete/:id", controllers.JobDelete)
	router.GET("/jobs/packaging/:id", controllers.JobShowPackaging)
	router.POST("/jobs/packaging/:id", controllers.JobSavePackaging)
	router.GET("/jobs/metadata/:id", controllers.JobShowMetadata)
	router.POST("/jobs/metadata/:id", controllers.JobSaveMetadata)
	router.GET("/jobs/add_tag/:id", controllers.JobAddTag)
	router.POST("/jobs/add_tag/:id", controllers.JobSaveTag)
	router.POST("/jobs/delete_tag/:id", controllers.JobDeleteTag)
	router.GET("/jobs/upload/:id", controllers.JobShowUpload)
	router.POST("/jobs/upload/:id", controllers.JobSaveUpload)
	router.GET("/jobs/files/:id", controllers.JobShowFiles)
	router.POST("/jobs/add_file/:id", controllers.JobAddFile)
	router.POST("/jobs/delete_file/:id", controllers.JobDeleteFile)
	router.GET("/jobs/summary/:id", controllers.JobRunShow)
	router.GET("/jobs/run/:id", controllers.JobRunExecute)
	router.GET("/jobs/show_json/:id", controllers.JobShowJson)

	// Job Artifacts
	router.GET("/jobs/artifacts/list/:job_id", controllers.JobArtifactsList)
	router.POST("/jobs/artifacts/save/:id", controllers.JobArtifactSave)
	router.GET("/jobs/artifacts/:id", controllers.JobArtifactShow)

	// Remote Repositories
	router.GET("/remote_repositories", controllers.RemoteRepositoryIndex)
	router.GET("/remote_repositories/new", controllers.RemoteRepositoryNew)
	router.POST("/remote_repositories/new", controllers.RemoteRepositorySave)
	router.GET("/remote_repositories/edit/:id", controllers.RemoteRepositoryEdit)
	router.PUT("/remote_repositories/edit/:id", controllers.RemoteRepositorySave)
	router.POST("/remote_repositories/edit/:id", controllers.RemoteRepositorySave)
	router.PUT("/remote_repositories/delete/:id", controllers.RemoteRepositoryDelete)
	router.POST("/remote_repositories/delete/:id", controllers.RemoteRepositoryDelete)
	router.POST("/remote_repositories/test/:id", controllers.RemoteRepositoryTestConnection)

	// Settings import/export
	router.GET("/settings/export", controllers.ExportSettingsIndex)
	router.GET("/settings/export/new", controllers.SettingsExportNew)
	router.GET("/settings/export/edit/:id", controllers.SettingsExportEdit)
	router.POST("/settings/export/save/:id", controllers.SettingsExportSave)
	router.POST("/settings/export/delete/:id", controllers.SettingsExportDelete)
	router.GET("/settings/export/show_json/:id", controllers.SettingsExportShowJson)
	router.POST("/settings/export/questions/delete/:settings_id/:question_id", controllers.SettingsExportDeleteQuestion)
	router.GET("/settings/export/questions/new/:id", controllers.SettingsExportNewQuestion)
	router.GET("/settings/export/questions/edit/:settings_id/:question_id", controllers.SettingsExportEditQuestion)
	router.POST("/settings/export/questions/:id", controllers.SettingsExportSaveQuestion)
	router.GET("/settings/import", controllers.SettingsImportShow)
	router.POST("/settings/import", controllers.SettingsImportRun)
	router.POST("/settings/import/answers", controllers.SettingsImportAnswers)
	// router.GET("/settings/profile_tags", controllers.SettingsProfileTagList)

	// Strorage Services
	router.GET("/storage_services", controllers.StorageServiceIndex)
	router.GET("/storage_services/new", controllers.StorageServiceNew)
	router.POST("/storage_services/new", controllers.StorageServiceSave)
	router.GET("/storage_services/edit/:id", controllers.StorageServiceEdit)
	router.PUT("/storage_services/edit/:id", controllers.StorageServiceSave)
	router.POST("/storage_services/edit/:id", controllers.StorageServiceSave)
	router.PUT("/storage_services/delete/:id", controllers.StorageServiceDelete)
	router.POST("/storage_services/delete/:id", controllers.StorageServiceDelete)
	router.POST("/storage_services/test/:id", controllers.StorageServiceTestConnection)

	// Upload Jobs
	//
	// These are disabled for now. We've hidden them from the main menu.
	// We can re-enable upload-only jobs if we restrict
	// them to uploading files only (no directories, because directory uploads
	// require considerable work and open up a huge number of potential problems).
	//
	router.GET("/upload_jobs/new", controllers.UploadJobNew)
	router.GET("/upload_jobs/files/:id", controllers.UploadJobShowFiles)
	router.POST("/upload_jobs/add_file/:id", controllers.UploadJobAddFile)
	router.POST("/upload_jobs/delete_file/:id", controllers.UploadJobDeleteFile)
	router.GET("/upload_jobs/targets/:id", controllers.UploadJobShowTargets)
	router.POST("/upload_jobs/targets/:id", controllers.UploadJobSaveTarget)
	router.GET("/upload_jobs/review/:id", controllers.UploadJobReview)
	router.GET("/upload_jobs/run/:id", controllers.UploadJobRun)

	// Validation Jobs
	router.GET("/validation_jobs/new", controllers.ValidationJobNew)
	router.GET("/validation_jobs/files/:id", controllers.ValidationJobShowFiles)
	router.POST("/validation_jobs/add_file/:id", controllers.ValidationJobAddFile)
	router.POST("/validation_jobs/delete_file/:id", controllers.ValidationJobDeleteFile)
	router.GET("/validation_jobs/profiles/:id", controllers.ValidationJobShowProfiles)
	router.POST("/validation_jobs/profiles/:id", controllers.ValidationJobSaveProfile)
	router.GET("/validation_jobs/review/:id", controllers.ValidationJobReview)
	router.GET("/validation_jobs/run/:id", controllers.ValidationJobRun)

	// Workflows
	router.GET("/workflows", controllers.WorkflowIndex)
	router.GET("/workflows/new", controllers.WorkflowNew)
	router.GET("/workflows/edit/:id", controllers.WorkflowEdit)
	router.PUT("/workflows/edit/:id", controllers.WorkflowSave)
	router.POST("/workflows/edit/:id", controllers.WorkflowSave)
	router.GET("/workflows/export/:id", controllers.WorkflowExport)
	router.PUT("/workflows/delete/:id", controllers.WorkflowDelete)
	router.POST("/workflows/delete/:id", controllers.WorkflowDelete)
	router.POST("/workflows/from_job/:jobId", controllers.WorkflowCreateFromJob)
	router.POST("/workflows/run/:id", controllers.WorkflowRun)
	router.GET("/workflows/batch/choose", controllers.WorkflowShowBatchForm)
	router.POST("/workflows/batch/validate", controllers.WorkflowBatchValidate)
	router.GET("/workflows/batch/run", controllers.WorkflowRunBatch)

	// Generic, reusable file chooser
	router.GET("/files/choose", controllers.ShowFileChooser)
}
