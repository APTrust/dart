package handlers

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/fileutil"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	"github.com/kirves/go-form-it/fields"
	_ "github.com/mattn/go-sqlite3"
	"github.com/minio/minio-go"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

func JobNewGet(w http.ResponseWriter, r *http.Request) {
	job := models.Job{}
	postUrl := "/job/run"
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(job, forms.POST, postUrl)
	form.Field("WorkflowID").SetSelectChoices(GetOptions("Workflow"))
	sourceDirField := fields.HiddenField("SourceDir")
	sourceDirField.SetId("SourceDir")
	form.Elements(sourceDirField)
	data["form"] = form
	err := templates.ExecuteTemplate(w, "job", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// Returns a Job form.
func JobForm(job models.Job) (*forms.Form, error) {
	postUrl := fmt.Sprintf("/job/new")
	if job.ID > uint(0) {
		postUrl = fmt.Sprintf("/job/%d/edit", job.ID)
	}
	form := forms.BootstrapFormFromModel(job, forms.POST, postUrl)

	// Remove the submit button from the end of the form,
	// add our new elements, and then replace the submit button
	// at the end.
	submitButton := form.Field("submit")
	form.RemoveElement("submit")

	// Add the tag value fields we need to display.
	// Last param, true, means hide fields that already have
	// default values.
	if &job.Workflow != nil && &job.Workflow.BagItProfile != nil {
		AddTagValueFields(job.Workflow.BagItProfile, form, true)
	}

	// Hide the tag fields that are filled in by default.
	// The user doesn't need to fill these out, but they
	// can unhide them if they want to edit them.

	form.Elements(submitButton)

	return form, nil
}

// This is a crude job runner for our demo. Break this out later,
// add proper error handling, etc. And fix the models too.
// We should be able to preload, instead of getting related ids
// and issuing new queries.
func JobRun(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	errMsg := ""
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
		errMsg += fmt.Sprintf("%s <br/>", err.Error())
	}

	// Gather the info we need to create the bag
	workflowId, _ := strconv.Atoi(r.PostFormValue("WorkflowID"))
	workflow := &models.Workflow{}
	db.Find(&workflow, workflowId)

	profile := &models.BagItProfile{}
	db.Preload("DefaultTagValues").Find(&profile, workflow.BagItProfileID)

	storageService := &models.StorageService{}
	db.Find(&storageService, workflow.StorageServiceID)

	stagingDir := models.AppSetting{}
	db.Where("name = ?", "Staging Directory").First(&stagingDir)

	sourceDir := r.PostFormValue("SourceDir")
	// HACK for demo: add virginia.edu. as bag name prefix
	bagName := "virginia.edu." + filepath.Base(sourceDir)
	bagPath := filepath.Join(stagingDir.Value, bagName)
	bagCreated := ("Creating bag " + bagName + " in " + stagingDir.Value + " using profile " +
		profile.Name + "<br/>")
	bagItProfile, err := profile.Profile()
	if err != nil {
		log.Println(err.Error())
	}

	// Create the bag by copying the files into a staging dir,
	// adding tags and manifests.
	bagCreated += "<h3>Files</h3>"
	bagger, err := bagit.NewBagger(bagPath, bagItProfile)
	sourceFiles, _ := fileutil.RecursiveFileList(sourceDir)
	relDestPaths := make([]string, len(sourceFiles))
	for i, absSrcPath := range sourceFiles {
		// Use forward slash, even on Windows, for path of file inside bag
		origPathMinusRootDir := strings.Replace(absSrcPath, sourceDir+"/", "", 1)
		relDestPath := fmt.Sprintf("data/%s", origPathMinusRootDir)
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
		bagCreated += ("Adding file " + absSrcPath + " at " + relDestPath + "<br/>")
	}
	bagCreated += "<br/>"

	// This adds the tags from the profile's default tag values.
	// In reality, several of the tags cannot come from general
	// defaults, because they're bag-specific. E.g. Title,
	// Description, Access, etc.
	bagCreated += "<h3>Tags</h3>"
	for _, dtv := range profile.DefaultTagValues {
		keyValuePair := &bagit.KeyValuePair{
			Key:   dtv.TagName,
			Value: dtv.TagValue,
		}
		bagger.AddTag(dtv.TagFile, keyValuePair)
		bagCreated += ("Adding tag " + dtv.TagName + " to file " + dtv.TagFile + "<br/>")
	}
	bagCreated += "<br/>"

	// Now that the bagger knows what to do, WriteBag() tells it to
	// go ahead and write out all the contents to the staging area.
	overwriteExistingBag := true
	checkRequiredTags := true
	bagger.WriteBag(overwriteExistingBag, checkRequiredTags)
	if len(bagger.Errors()) > 0 {
		for _, errMsg := range bagger.Errors() {
			errMsg += fmt.Sprintf("%s <br/>", err.Error())
		}
	} else {
		bagCreated += ("Bag was written to " + bagPath + "\n\n")
	}

	manifestPath := filepath.Join(bagPath, "manifest-md5.txt")
	if fileutil.FileExists(manifestPath) {
		manifestData, err := ioutil.ReadFile(manifestPath)
		if err != nil {
			errMsg += fmt.Sprintf("%s <br/>", err.Error())
		} else {
			data["Manifest"] = string(manifestData)
		}
	}

	aptPath := filepath.Join(bagPath, "aptrust-info.txt")
	if fileutil.FileExists(aptPath) {
		aptData, err := ioutil.ReadFile(aptPath)
		if err != nil {
			errMsg += fmt.Sprintf("%s <br/>", err.Error())
		} else {
			data["APTrustInfo"] = string(aptData)
		}
	}

	bagInfoPath := filepath.Join(bagPath, "bag-info.txt")
	if fileutil.FileExists(bagInfoPath) {
		bagInfoData, err := ioutil.ReadFile(bagInfoPath)
		if err != nil {
			errMsg += fmt.Sprintf("%s <br/>", err.Error())
		} else {
			data["BagInfo"] = string(bagInfoData)
		}
	}

	// Tar the bag, if the Workflow config says to do that.
	// In the future, we may support formats other than tar.
	// Also, we will likely have to supply our own tar program
	// because Windows users won't have one.
	bagPathForValidation := bagPath
	tarFileName := fmt.Sprintf("%s.tar", bagName)
	if workflow.SerializationFormat == "tar" {
		cleanBagPath := bagPath
		if strings.HasSuffix(bagPath, string(os.PathSeparator)) {
			// Chop off final path separator, so call to filepath.Dir
			// below will return the parent dir name.
			cleanBagPath = bagPath[0 : len(bagPath)-1]
		}
		workingDir := filepath.Dir(cleanBagPath)
		tarFileAbsPath := filepath.Join(workingDir, tarFileName)
		bagCreated += ("Tarring bag to " + tarFileAbsPath + "\n")
		//cmd := exec.Command("tar", "cf", tarFileName, "--directory", bagName)
		cmd := exec.Command("tar", "cf", tarFileName, bagName)
		cmd.Dir = workingDir
		commandOutput, err := cmd.CombinedOutput()
		if err != nil {
			errMsg += fmt.Sprintf("%s <br/>", err.Error())
		}
		bagCreated += fmt.Sprintf("%s <br/><br/>", string(commandOutput))
		bagPathForValidation = tarFileAbsPath
	}

	// Validate the bag, just to make sure...
	bagCreated += "<h3>Validation</h3>"
	bagCreated += "Validating bag...<br/>"
	bag := bagit.NewBag(bagPathForValidation)
	validator := bagit.NewValidator(bag, bagItProfile)
	validator.ReadBag()
	if len(validator.Errors()) > 0 {
		for _, e := range validator.Errors() {
			errMsg += fmt.Sprintf("%s <br/>", e)
		}
	} else {
		bagCreated += ("Bag is valid <br/>")
		if fileutil.LooksSafeToDelete(bagPath, 15, 3) {
			os.RemoveAll(bagPath)
			bagCreated += "Deleting working directory, kept tar file. <br/>"
		}
	}

	data["BagName"] = bagName
	data["BagCreated"] = template.HTML(bagCreated)

	// If the config includes an S3 upload, do that now.
	// Use the minio client from https://minio.io/downloads.html#minio-client
	// Doc is at https://docs.minio.io/docs/minio-client-complete-guide
	// We're checking for S3, because this step is for demo only, and
	// s3 is the only storage service we've implemented.
	if storageService != nil && storageService.Protocol == "s3" {
		// Hack for demo: get S3 keys out of the environment.
		accessKeyID := os.Getenv("AWS_ACCESS_KEY_ID")
		secretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
		useSSL := true
		minioClient, err := minio.New(storageService.URL, accessKeyID, secretAccessKey, useSSL)
		if err != nil {
			errMsg += ("Error creating S3 uploader: " + err.Error() + "<br/>")
			errMsg += storageService.URL
			return
		}
		n, err := minioClient.FPutObject(storageService.BucketOrFolder,
			tarFileName, // we're assuming the tar file was made for this demo
			bagPathForValidation,
			minio.PutObjectOptions{ContentType: "application/x-tar"})
		if err != nil {
			errMsg += ("Error uploading tar file to S3: " + err.Error() + "<br/>")
		} else {
			msg := fmt.Sprintf("Successfully uploaded %s of size %d to receiving bucket.", tarFileName, n)
			data["UploadResult"] = template.HTML(msg + "<br/>")
		}
	}

	if errMsg != "" {
		data["Error"] = template.HTML(errMsg)
	}

	err = templates.ExecuteTemplate(w, "job-result", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
