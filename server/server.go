package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/fileutil"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/gorilla/mux"
	"github.com/gorilla/schema"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	"github.com/kirves/go-form-it/fields"
	_ "github.com/mattn/go-sqlite3"
	"github.com/minio/minio-go"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

var templates *template.Template
var decoder = schema.NewDecoder()
var db *gorm.DB

func main() {
	CompileTemplates()
	InitDBConnection()
	http.Handle("/static/", http.FileServer(http.Dir(GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))

	r := mux.NewRouter()
	r.HandleFunc("/", HandleRootRequest)
	r.HandleFunc("/bags", BagsList).Methods("GET")
	r.HandleFunc("/bag/{id:[0-9]+}", BagDetail).Methods("GET")
	r.HandleFunc("/job/new", JobNewGet).Methods("GET")
	r.HandleFunc("/job/run", JobRun).Methods("POST")
	r.HandleFunc("/profiles", ProfilesList)
	r.HandleFunc("/profile/new", ProfileNewGet).Methods("GET")
	r.HandleFunc("/profile/new", ProfileNewPost).Methods("POST", "PUT")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditGet).Methods("GET")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditPost).Methods("POST", "PUT")
	r.HandleFunc("/app_settings", AppSettingsList)
	r.HandleFunc("/app_setting/new", AppSettingNewGet).Methods("GET")
	r.HandleFunc("/app_setting/new", AppSettingNewPost).Methods("POST", "PUT")
	r.HandleFunc("/app_setting/{id:[0-9]+}/edit", AppSettingEditGet).Methods("GET")
	r.HandleFunc("/app_setting/{id:[0-9]+}/edit", AppSettingEditPost).Methods("POST", "PUT")
	r.HandleFunc("/storage_services", StorageServicesList)
	r.HandleFunc("/storage_service/new", StorageServiceNewGet).Methods("GET")
	r.HandleFunc("/storage_service/new", StorageServiceNewPost).Methods("POST", "PUT")
	r.HandleFunc("/storage_service/{id:[0-9]+}/edit", StorageServiceEditGet).Methods("GET")
	r.HandleFunc("/storage_service/{id:[0-9]+}/edit", StorageServiceEditPost).Methods("POST", "PUT")
	r.HandleFunc("/workflows", WorkflowsList)
	r.HandleFunc("/workflow/new", WorkflowNewGet).Methods("GET")
	r.HandleFunc("/workflow/new", WorkflowNewPost).Methods("POST", "PUT")
	r.HandleFunc("/workflow/{id:[0-9]+}/edit", WorkflowEditGet).Methods("GET")
	r.HandleFunc("/workflow/{id:[0-9]+}/edit", WorkflowEditPost).Methods("POST", "PUT")
	http.Handle("/", r)

	go func() {
		time.Sleep(600 * time.Millisecond)
		//OpenBrowser("http://localhost:8080")
		OpenElectron()
	}()
	log.Fatal(http.ListenAndServe("127.0.0.1:8080", nil))
}

func GetServerRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Dir(filename)
}

func GetImageRoot() string {
	return filepath.Join(GetServerRoot(), "static", "img")
}

func CompileTemplates() {
	dir := GetServerRoot()
	templateDir, _ := filepath.Abs(filepath.Join(dir, "templates", "*.html"))
	log.Println("Loading templates:", templateDir)
	templates = template.Must(template.ParseGlob(templateDir))
}

func HandleRootRequest(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	err := templates.ExecuteTemplate(w, "index", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

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

// This is a crude job runner for our demo. Break this out later,
// add proper error handling, etc. And fix the models too.
// We should be able to preload, instead of getting related ids
// and issuing new queries.
func JobRun(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
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
	w.Write([]byte("Creating bag " + bagName + " in " + stagingDir.Value + " using profile " +
		profile.Name + "\n\n"))
	bagItProfile, err := profile.Profile()
	if err != nil {
		log.Println(err.Error())
	}

	// Create the bag by copying the files into a staging dir,
	// adding tags and manifests.
	bagger, err := bagit.NewBagger(bagPath, bagItProfile)
	sourceFiles, _ := fileutil.RecursiveFileList(sourceDir)
	relDestPaths := make([]string, len(sourceFiles))
	for i, absSrcPath := range sourceFiles {
		// Use forward slash, even on Windows, for path of file inside bag
		origPathMinusRootDir := strings.Replace(absSrcPath, sourceDir+"/", "", 1)
		relDestPath := fmt.Sprintf("data/%s", origPathMinusRootDir)
		bagger.AddFile(absSrcPath, relDestPath)
		relDestPaths[i] = relDestPath
		w.Write([]byte("Adding file " + absSrcPath + " at " + relDestPath + "\n"))
	}

	w.Write([]byte("\n"))

	// This adds the tags from the profile's default tag values.
	// In reality, several of the tags cannot come from general
	// defaults, because they're bag-specific. E.g. Title,
	// Description, Access, etc.
	for _, dtv := range profile.DefaultTagValues {
		keyValuePair := &bagit.KeyValuePair{
			Key:   dtv.TagName,
			Value: dtv.TagValue,
		}
		bagger.AddTag(dtv.TagFile, keyValuePair)
		w.Write([]byte("Adding tag " + dtv.TagName + " to file " + dtv.TagFile + "\n"))
	}

	w.Write([]byte("\n"))

	// Now that the bagger knows what to do, WriteBag() tells it to
	// go ahead and write out all the contents to the staging area.
	overwriteExistingBag := true
	checkRequiredTags := true
	bagger.WriteBag(overwriteExistingBag, checkRequiredTags)
	if len(bagger.Errors()) > 0 {
		w.Write([]byte("Oops! We have some errors...\n"))
		for _, errMsg := range bagger.Errors() {
			w.Write([]byte(errMsg + "\n"))
		}
	} else {
		w.Write([]byte("Bag was written to " + bagPath + "\n\n"))
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
		w.Write([]byte("Tarring bag to " + tarFileAbsPath + "\n"))
		//cmd := exec.Command("tar", "cf", tarFileName, "--directory", bagName)
		cmd := exec.Command("tar", "cf", tarFileName, bagName)
		cmd.Dir = workingDir
		commandOutput, err := cmd.CombinedOutput()
		if err != nil {
			w.Write([]byte(err.Error()))
		}
		w.Write(commandOutput)
		w.Write([]byte("\n\n"))
		bagPathForValidation = tarFileAbsPath
	}

	// Validate the bag, just to make sure...
	w.Write([]byte("\n\nValidating bag...\n\n"))
	bag := bagit.NewBag(bagPathForValidation)
	validator := bagit.NewValidator(bag, bagItProfile)
	validator.ReadBag()
	if len(validator.Errors()) > 0 {
		for _, errMsg := range validator.Errors() {
			w.Write([]byte(errMsg + "\n"))
		}
	} else {
		w.Write([]byte("Bag is valid\n"))
		if fileutil.LooksSafeToDelete(bagPath, 15, 3) {
			os.RemoveAll(bagPath)
			w.Write([]byte("Deleting working directory, kept tar file\n"))
		}
	}

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
			w.Write([]byte("Error creating S3 uploader: " + err.Error() + "\n"))
			w.Write([]byte(storageService.URL))
			return
		}
		n, err := minioClient.FPutObject(storageService.BucketOrFolder,
			tarFileName, // we're assuming the tar file was made for this demo
			bagPathForValidation,
			minio.PutObjectOptions{ContentType: "application/x-tar"})
		if err != nil {
			w.Write([]byte("Error uploading tar file to S3: " + err.Error() + "\n"))
		} else {
			msg := fmt.Sprintf("Successfully uploaded %s of size %d\n", tarFileName, n)
			w.Write([]byte(msg + "\n"))
		}
	}
}

func ProfileNewGet(w http.ResponseWriter, r *http.Request) {
	profile := models.BagItProfile{}
	form, err := profile.GetForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data := make(map[string]interface{})
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileNewPost(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile := &models.BagItProfile{}
	err = decoder.Decode(profile, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	err = db.Save(&profile).Error
	if err != nil {
		log.Println("Error:", err.Error())
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		log.Println(defaultTagValues)
		for _, val := range defaultTagValues {
			var valErr error
			if db.NewRecord(val) {
				log.Println("Creating", val.TagName, "=", val.TagValue)
				valErr = db.Create(&val).Error
			} else {
				log.Println("Updting", val.TagName, "=", val.TagValue)
				valErr = db.Save(&val).Error
			}
			if valErr != nil {
				log.Println("Error on", val.TagName, ":", valErr.Error())
				err = valErr
			}
		}
	}

	if err != nil {
		log.Println("Error:", err.Error())
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return
	}

	form, err := profile.GetForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfilesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	profiles := make([]models.BagItProfile, 0)
	db.Find(&profiles).Order("name")
	data["items"] = profiles
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "bagit-profile-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET profile", id)
	profile := models.BagItProfile{}
	db.Preload("DefaultTagValues").First(&profile, id)
	data := make(map[string]interface{})
	form, err := profile.GetForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileEditPost(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST profile", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile := &models.BagItProfile{}
	err = decoder.Decode(profile, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile.ID = uint(id)
	err = db.Save(&profile).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
		for _, val := range defaultTagValues {
			var valErr error
			if db.NewRecord(val) {
				log.Println("Creating", val.TagName, "=", val.TagValue)
				valErr = db.Create(&val).Error
			} else {
				log.Println("Updting", val.TagName, "=", val.TagValue)
				valErr = db.Save(&val).Error
			}
			if valErr != nil {
				log.Println("Error on", val.TagName, ":", valErr.Error())
				err = valErr
			}
		}
	}

	if err != nil {
		data["errors"] = err.Error()
	} else {
		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
		return
	}

	form, err := profile.GetForm()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	data["form"] = form
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServicesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	services := make([]models.StorageService, 0)
	db.Find(&services)
	data["items"] = services
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "storage-service-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	service := models.StorageService{}
	form := forms.BootstrapFormFromModel(service, forms.POST, "/storage_service/new")
	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service := &models.StorageService{}
	err = decoder.Decode(service, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	err = db.Create(&service).Error
	postUrl := fmt.Sprintf("/storage_service/new")
	if err != nil {
		data["errors"] = err.Error()
		postUrl = fmt.Sprintf("/storage_service/%d/edit", service.ID)
	} else {
		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
		return
	}
	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Storage Service", id)
	service := models.StorageService{}
	err := db.Find(&service, uint(id)).Error
	if err != nil {
		log.Println(err.Error())
	}
	// log.Println(service)
	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(service, forms.POST, postUrl)
	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
	form.Field("Protocol").SetValue(service.Protocol)
	data["form"] = form
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST Storage Service", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service := &models.StorageService{}
	err = decoder.Decode(service, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	service.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&service).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "storage-service-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	settings := make([]models.AppSetting, 0)
	db.Find(&settings)
	data["items"] = settings
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err := templates.ExecuteTemplate(w, "app-settings-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	setting := models.AppSetting{}
	form := forms.BootstrapFormFromModel(setting, forms.POST, "/app_setting/new")
	data["form"] = form
	err := templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting := &models.AppSetting{}
	err = decoder.Decode(setting, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	err = db.Create(&setting).Error
	postUrl := fmt.Sprintf("/app_setting/new")
	if err != nil {
		data["errors"] = err.Error()
		postUrl = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
	} else {
		msg := fmt.Sprintf("Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return
	}
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET App Setting", id)
	setting := models.AppSetting{}
	err := db.Find(&setting, uint(id)).Error
	if err != nil {
		log.Println(err.Error())
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(setting, forms.POST, postUrl)
	data["form"] = form
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func AppSettingEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST App Setting", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting := &models.AppSetting{}
	err = decoder.Decode(setting, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	setting.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&setting).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Application Setting '%s' has been saved", setting.Name)
		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "app-setting-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func BagsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	bags := make([]models.Bag, 0)
	err := db.Find(&bags).Error
	if err != nil {
		log.Println(err.Error())
	}
	data["items"] = bags
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err = templates.ExecuteTemplate(w, "bag-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func BagDetail(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Bag", id)
	bag := models.Bag{}
	err := db.Find(&bag, id).Preload("Files").Error
	if err != nil {
		log.Println(err.Error())
	}
	data["item"] = bag
	data["items"] = bag.Files
	err = templates.ExecuteTemplate(w, "bag-detail", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	workflows := make([]models.Workflow, 0)
	err := db.Find(&workflows).Error
	if err != nil {
		log.Println(err.Error())
	}
	data["items"] = workflows
	successMessage, ok := r.URL.Query()["success"]
	if ok {
		data["success"] = successMessage[0]
	}
	err = templates.ExecuteTemplate(w, "workflow-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowNewGet(w http.ResponseWriter, r *http.Request) {
	workflow := models.Workflow{}
	postUrl := "/workflow/new"
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow := &models.Workflow{}
	err = decoder.Decode(workflow, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	postUrl := "/workflow/new"
	err = db.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return
	}
	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
	data["form"] = form
	err = templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowEditGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("GET Workflow", id)
	workflow := models.Workflow{}
	db.Find(&workflow, uint(id))
	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowEditPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])
	log.Println("POST Workflow", id)
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow := &models.Workflow{}
	err = decoder.Decode(workflow, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	workflow.ID = uint(id)
	data := make(map[string]interface{})
	err = db.Save(&workflow).Error
	if err != nil {
		data["errors"] = err.Error()
	} else {
		msg := fmt.Sprintf("Workflow '%s' has been saved.", workflow.Name)
		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
		return
	}
	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
	data["form"] = form
	err = templates.ExecuteTemplate(w, "workflow-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func OpenBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	err := exec.Command(cmd, args...).Start()
	if err != nil {
		log.Println("Error opening browser:", err.Error())
	} else {
		log.Println("Opened browser")
	}
}

func OpenElectron() {
	var cmd string
	var args []string

	// TODO: Fix for non-mac OS

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "/Applications/Electron.app/Contents/MacOS/Electron"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		panic("Rumtime cannot get caller file name.")
	}
	absFileName, err := filepath.Abs(filename)
	if err != nil {
		panic(err)
	}
	electronAppPath := filepath.Join(absFileName, "..", "..", "electron")

	args = append(args, electronAppPath)
	err = exec.Command(cmd, args...).Start()
	if err != nil {
		log.Println("Error opening Electron:", err.Error())
	} else {
		log.Println("Opened browser")
	}
}

func GetOptions(modelName string) map[string][]fields.InputChoice {
	// BagItProfile, StorageService
	choices := make([]fields.InputChoice, 1)
	choices[0] = fields.InputChoice{Id: "", Val: ""}
	if modelName == "BagItProfile" {
		profiles := make([]models.BagItProfile, 0)
		db.Select("id, name").Find(&profiles).Order("name")
		for _, profile := range profiles {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(profile.ID), 10),
				Val: profile.Name})
		}
	} else if modelName == "StorageService" {
		services := make([]models.StorageService, 0)
		db.Select("id, name").Find(&services).Order("name")
		for _, service := range services {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(service.ID), 10),
				Val: service.Name})
		}
	} else if modelName == "Workflow" {
		workflows := make([]models.Workflow, 0)
		db.Select("id, name").Find(&workflows).Order("name")
		for _, workflow := range workflows {
			choices = append(choices, fields.InputChoice{
				Id:  strconv.FormatUint(uint64(workflow.ID), 10),
				Val: workflow.Name})
		}
	} else if modelName == "SerializationFormat" {
		choices = append(choices, fields.InputChoice{Id: "gzip", Val: "gzip"})
		choices = append(choices, fields.InputChoice{Id: "tar", Val: "tar"})
		choices = append(choices, fields.InputChoice{Id: "zip", Val: "zip"})
	} else if modelName == "Protocol" {
		choices = append(choices, fields.InputChoice{Id: "ftp", Val: "ftp"})
		choices = append(choices, fields.InputChoice{Id: "rsync", Val: "rsync"})
		choices = append(choices, fields.InputChoice{Id: "s3", Val: "s3"})
		choices = append(choices, fields.InputChoice{Id: "scp", Val: "scp"})
	}
	options := make(map[string][]fields.InputChoice)
	options[""] = choices
	return options
}

// TODO: This is also used by the easy_store_setup app.
// Put it on one place, and don't rely on testutil.GetPathToSchema()
// as that file and directory exist in dev mode only, and users
// won't have them.
func InitDBConnection() {
	schemaPath, err := testutil.GetPathToSchema()
	if err != nil {
		panic(err.Error())
	}
	dbFilePath := filepath.Join(filepath.Dir(schemaPath), "..", "..", "easy-store.db")
	// This sets the main global var db.
	db, err = gorm.Open("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	db.LogMode(true)
}
