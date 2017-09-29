package main

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/gorilla/mux"
	"github.com/gorilla/schema"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/kirves/go-form-it"
	"github.com/kirves/go-form-it/fields"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
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
	r.HandleFunc("/profiles", ProfilesList)
	r.HandleFunc("/profile/new", ProfileNewGet).Methods("GET")
	r.HandleFunc("/profile/new", ProfileNewPost).Methods("POST", "PUT")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditGet).Methods("GET")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditPost).Methods("POST", "PUT")
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
	postUrl := "/job/new"
	data := make(map[string]interface{})
	form := forms.BootstrapFormFromModel(job, forms.POST, postUrl)
	// form.Field("WorkflowId").SetSelectChoices(models.GetOptions("Workflow"))
	//	form.Field("WorkflowId").SetValue(strconv.FormatInt(*workflowId, 10))
	data["form"] = form
	err := templates.ExecuteTemplate(w, "job", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
	db.First(&profile, id)
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
}
