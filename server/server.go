package main

import (
	"github.com/APTrust/easy-store/server/handlers"
	"github.com/gorilla/mux"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// var templates *template.Template
// var decoder = schema.NewDecoder()
// var db *gorm.DB

func main() {
	handlers.CompileTemplates()
	handlers.InitDBConnection()
	http.Handle("/static/", http.FileServer(http.Dir(handlers.GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))

	r := mux.NewRouter()
	r.HandleFunc("/", handlers.HandleRootRequest)
	r.HandleFunc("/bags", handlers.BagsList).Methods("GET")
	r.HandleFunc("/bag/{id:[0-9]+}", handlers.BagDetail).Methods("GET")
	r.HandleFunc("/job/new", handlers.JobNewGet).Methods("GET")
	r.HandleFunc("/job/run", handlers.JobRun).Methods("POST")
	// r.HandleFunc("/profiles", ProfilesList)
	// r.HandleFunc("/profile/new", ProfileNewGet).Methods("GET")
	// r.HandleFunc("/profile/new", ProfileNewPost).Methods("POST", "PUT")
	// r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditGet).Methods("GET")
	// r.HandleFunc("/profile/{id:[0-9]+}/edit", ProfileEditPost).Methods("POST", "PUT")
	// r.HandleFunc("/app_settings", AppSettingsList)
	// r.HandleFunc("/app_setting/new", AppSettingNewGet).Methods("GET")
	// r.HandleFunc("/app_setting/new", AppSettingNewPost).Methods("POST", "PUT")
	// r.HandleFunc("/app_setting/{id:[0-9]+}/edit", AppSettingEditGet).Methods("GET")
	// r.HandleFunc("/app_setting/{id:[0-9]+}/edit", AppSettingEditPost).Methods("POST", "PUT")
	// r.HandleFunc("/storage_services", StorageServicesList)
	// r.HandleFunc("/storage_service/new", StorageServiceNewGet).Methods("GET")
	// r.HandleFunc("/storage_service/new", StorageServiceNewPost).Methods("POST", "PUT")
	// r.HandleFunc("/storage_service/{id:[0-9]+}/edit", StorageServiceEditGet).Methods("GET")
	// r.HandleFunc("/storage_service/{id:[0-9]+}/edit", StorageServiceEditPost).Methods("POST", "PUT")
	// r.HandleFunc("/workflows", WorkflowsList)
	// r.HandleFunc("/workflow/new", WorkflowNewGet).Methods("GET")
	// r.HandleFunc("/workflow/new", WorkflowNewPost).Methods("POST", "PUT")
	// r.HandleFunc("/workflow/{id:[0-9]+}/edit", WorkflowEditGet).Methods("GET")
	// r.HandleFunc("/workflow/{id:[0-9]+}/edit", WorkflowEditPost).Methods("POST", "PUT")
	http.Handle("/", r)

	go func() {
		time.Sleep(600 * time.Millisecond)
		//OpenBrowser("http://localhost:8080")
		OpenElectron()
	}()
	log.Fatal(http.ListenAndServe("127.0.0.1:8080", nil))
}

func GetImageRoot() string {
	return filepath.Join(handlers.GetServerRoot(), "static", "img")
}

// func ProfileNewGet(w http.ResponseWriter, r *http.Request) {
// 	profile := models.BagItProfile{}
// 	form, err := profile.GetForm()
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// 	data := make(map[string]interface{})
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func ProfileNewPost(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	profile := &models.BagItProfile{}
// 	err = decoder.Decode(profile, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	err = db.Save(&profile).Error
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 		data["errors"] = err.Error()
// 	} else {
// 		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
// 		log.Println(defaultTagValues)
// 		for _, val := range defaultTagValues {
// 			var valErr error
// 			if db.NewRecord(val) {
// 				log.Println("Creating", val.TagName, "=", val.TagValue)
// 				valErr = db.Create(&val).Error
// 			} else {
// 				log.Println("Updting", val.TagName, "=", val.TagValue)
// 				valErr = db.Save(&val).Error
// 			}
// 			if valErr != nil {
// 				log.Println("Error on", val.TagName, ":", valErr.Error())
// 				err = valErr
// 			}
// 		}
// 	}

// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 		data["errors"] = err.Error()
// 	} else {
// 		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
// 		return
// 	}

// 	form, err := profile.GetForm()
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func ProfilesList(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	profiles := make([]models.BagItProfile, 0)
// 	db.Find(&profiles).Order("name")
// 	data["items"] = profiles
// 	successMessage, ok := r.URL.Query()["success"]
// 	if ok {
// 		data["success"] = successMessage[0]
// 	}
// 	err := templates.ExecuteTemplate(w, "bagit-profile-list", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func ProfileEditGet(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("GET profile", id)
// 	profile := models.BagItProfile{}
// 	db.Preload("DefaultTagValues").First(&profile, id)
// 	data := make(map[string]interface{})
// 	form, err := profile.GetForm()
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func ProfileEditPost(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("POST profile", id)
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	profile := &models.BagItProfile{}
// 	err = decoder.Decode(profile, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	profile.ID = uint(id)
// 	err = db.Save(&profile).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		defaultTagValues := profile.DecodeDefaultTagValues(r.PostForm)
// 		for _, val := range defaultTagValues {
// 			var valErr error
// 			if db.NewRecord(val) {
// 				log.Println("Creating", val.TagName, "=", val.TagValue)
// 				valErr = db.Create(&val).Error
// 			} else {
// 				log.Println("Updting", val.TagName, "=", val.TagValue)
// 				valErr = db.Save(&val).Error
// 			}
// 			if valErr != nil {
// 				log.Println("Error on", val.TagName, ":", valErr.Error())
// 				err = valErr
// 			}
// 		}
// 	}

// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		http.Redirect(w, r, "/profiles?success=Profile+has+been+saved.", 303)
// 		return
// 	}

// 	form, err := profile.GetForm()
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func StorageServicesList(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	services := make([]models.StorageService, 0)
// 	db.Find(&services)
// 	data["items"] = services
// 	successMessage, ok := r.URL.Query()["success"]
// 	if ok {
// 		data["success"] = successMessage[0]
// 	}
// 	err := templates.ExecuteTemplate(w, "storage-service-list", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func StorageServiceNewGet(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	service := models.StorageService{}
// 	form := forms.BootstrapFormFromModel(service, forms.POST, "/storage_service/new")
// 	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
// 	data["form"] = form
// 	err := templates.ExecuteTemplate(w, "storage-service-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func StorageServiceNewPost(w http.ResponseWriter, r *http.Request) {
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	service := &models.StorageService{}
// 	err = decoder.Decode(service, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	data := make(map[string]interface{})
// 	err = db.Create(&service).Error
// 	postUrl := fmt.Sprintf("/storage_service/new")
// 	if err != nil {
// 		data["errors"] = err.Error()
// 		postUrl = fmt.Sprintf("/storage_service/%d/edit", service.ID)
// 	} else {
// 		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
// 		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
// 	err = templates.ExecuteTemplate(w, "storage-service-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func StorageServiceEditGet(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("GET Storage Service", id)
// 	service := models.StorageService{}
// 	err := db.Find(&service, uint(id)).Error
// 	if err != nil {
// 		log.Println(err.Error())
// 	}
// 	// log.Println(service)
// 	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
// 	data := make(map[string]interface{})
// 	form := forms.BootstrapFormFromModel(service, forms.POST, postUrl)
// 	form.Field("Protocol").SetSelectChoices(GetOptions("Protocol"))
// 	form.Field("Protocol").SetValue(service.Protocol)
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "storage-service-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func StorageServiceEditPost(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("POST Storage Service", id)
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	service := &models.StorageService{}
// 	err = decoder.Decode(service, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	service.ID = uint(id)
// 	data := make(map[string]interface{})
// 	err = db.Save(&service).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		msg := fmt.Sprintf("Storage Service '%s' has been saved", service.Name)
// 		http.Redirect(w, r, "/storage_services?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
// 	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
// 	err = templates.ExecuteTemplate(w, "storage-service-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func AppSettingsList(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	settings := make([]models.AppSetting, 0)
// 	db.Find(&settings)
// 	data["items"] = settings
// 	successMessage, ok := r.URL.Query()["success"]
// 	if ok {
// 		data["success"] = successMessage[0]
// 	}
// 	err := templates.ExecuteTemplate(w, "app-settings-list", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func AppSettingNewGet(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	setting := models.AppSetting{}
// 	form := forms.BootstrapFormFromModel(setting, forms.POST, "/app_setting/new")
// 	data["form"] = form
// 	err := templates.ExecuteTemplate(w, "app-setting-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func AppSettingNewPost(w http.ResponseWriter, r *http.Request) {
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	setting := &models.AppSetting{}
// 	err = decoder.Decode(setting, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	data := make(map[string]interface{})
// 	err = db.Create(&setting).Error
// 	postUrl := fmt.Sprintf("/app_setting/new")
// 	if err != nil {
// 		data["errors"] = err.Error()
// 		postUrl = fmt.Sprintf("/app_setting/%d/edit", setting.ID)
// 	} else {
// 		msg := fmt.Sprintf("Setting '%s' has been saved", setting.Name)
// 		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
// 	err = templates.ExecuteTemplate(w, "app-setting-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func AppSettingEditGet(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("GET App Setting", id)
// 	setting := models.AppSetting{}
// 	err := db.Find(&setting, uint(id)).Error
// 	if err != nil {
// 		log.Println(err.Error())
// 	}
// 	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
// 	data := make(map[string]interface{})
// 	form := forms.BootstrapFormFromModel(setting, forms.POST, postUrl)
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "app-setting-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func AppSettingEditPost(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("POST App Setting", id)
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	setting := &models.AppSetting{}
// 	err = decoder.Decode(setting, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	setting.ID = uint(id)
// 	data := make(map[string]interface{})
// 	err = db.Save(&setting).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		msg := fmt.Sprintf("Application Setting '%s' has been saved", setting.Name)
// 		http.Redirect(w, r, "/app_settings?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	postUrl := fmt.Sprintf("/app_setting/%d/edit", id)
// 	data["form"] = forms.BootstrapFormFromModel(*setting, forms.POST, postUrl)
// 	err = templates.ExecuteTemplate(w, "app-setting-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func WorkflowsList(w http.ResponseWriter, r *http.Request) {
// 	data := make(map[string]interface{})
// 	workflows := make([]models.Workflow, 0)
// 	err := db.Find(&workflows).Error
// 	if err != nil {
// 		log.Println(err.Error())
// 	}
// 	data["items"] = workflows
// 	successMessage, ok := r.URL.Query()["success"]
// 	if ok {
// 		data["success"] = successMessage[0]
// 	}
// 	err = templates.ExecuteTemplate(w, "workflow-list", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func WorkflowNewGet(w http.ResponseWriter, r *http.Request) {
// 	workflow := models.Workflow{}
// 	postUrl := "/workflow/new"
// 	data := make(map[string]interface{})
// 	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
// 	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
// 	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
// 	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
// 	data["form"] = form
// 	err := templates.ExecuteTemplate(w, "workflow-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func WorkflowNewPost(w http.ResponseWriter, r *http.Request) {
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	workflow := &models.Workflow{}
// 	err = decoder.Decode(workflow, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	data := make(map[string]interface{})
// 	postUrl := "/workflow/new"
// 	err = db.Save(&workflow).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		msg := fmt.Sprintf("Workflow '%s' has been saved", workflow.Name)
// 		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
// 	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
// 	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
// 	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
// 	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
// 	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
// 	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "workflow-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func WorkflowEditGet(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("GET Workflow", id)
// 	workflow := models.Workflow{}
// 	db.Find(&workflow, uint(id))
// 	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
// 	data := make(map[string]interface{})
// 	form := forms.BootstrapFormFromModel(workflow, forms.POST, postUrl)
// 	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
// 	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
// 	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
// 	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
// 	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
// 	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
// 	data["form"] = form
// 	err := templates.ExecuteTemplate(w, "workflow-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

// func WorkflowEditPost(w http.ResponseWriter, r *http.Request) {
// 	vars := mux.Vars(r)
// 	id, _ := strconv.Atoi(vars["id"])
// 	log.Println("POST Workflow", id)
// 	err := r.ParseForm()
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	workflow := &models.Workflow{}
// 	err = decoder.Decode(workflow, r.PostForm)
// 	if err != nil {
// 		log.Println("Error:", err.Error())
// 	}
// 	workflow.ID = uint(id)
// 	data := make(map[string]interface{})
// 	err = db.Save(&workflow).Error
// 	if err != nil {
// 		data["errors"] = err.Error()
// 	} else {
// 		msg := fmt.Sprintf("Workflow '%s' has been saved.", workflow.Name)
// 		http.Redirect(w, r, "/workflows?success="+url.QueryEscape(msg), 303)
// 		return
// 	}
// 	postUrl := fmt.Sprintf("/workflow/%d/edit", id)
// 	form := forms.BootstrapFormFromModel(*workflow, forms.POST, postUrl)
// 	form.Field("SerializationFormat").SetSelectChoices(GetOptions("SerializationFormat"))
// 	form.Field("SerializationFormat").SetValue(workflow.SerializationFormat)
// 	form.Field("BagItProfileID").SetSelectChoices(GetOptions("BagItProfile"))
// 	form.Field("BagItProfileID").SetValue(strconv.FormatInt(workflow.BagItProfileID, 10))
// 	form.Field("StorageServiceID").SetSelectChoices(GetOptions("StorageService"))
// 	form.Field("StorageServiceID").SetValue(strconv.FormatInt(workflow.StorageServiceID, 10))
// 	data["form"] = form
// 	err = templates.ExecuteTemplate(w, "workflow-form", data)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// }

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
		log.Println("Opened Electron")
	}
}
