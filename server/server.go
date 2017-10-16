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

func main() {
	handlers.CompileTemplates(GetServerRoot())
	handlers.InitDBConnection()
	http.Handle("/static/", http.FileServer(http.Dir(GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))

	r := mux.NewRouter()
	r.HandleFunc("/", handlers.HandleRootRequest)
	r.HandleFunc("/app_settings", handlers.AppSettingsList)
	r.HandleFunc("/app_setting/new", handlers.AppSettingNewGet).Methods("GET")
	r.HandleFunc("/app_setting/new", handlers.AppSettingNewPost).Methods("POST", "PUT")
	r.HandleFunc("/app_setting/{id:[0-9]+}/edit", handlers.AppSettingEditGet).Methods("GET")
	r.HandleFunc("/app_setting/{id:[0-9]+}/edit", handlers.AppSettingEditPost).Methods("POST", "PUT")
	r.HandleFunc("/bags", handlers.BagsList).Methods("GET")
	r.HandleFunc("/bag/{id:[0-9]+}", handlers.BagDetail).Methods("GET")
	r.HandleFunc("/job/new", handlers.JobNewGet).Methods("GET")
	r.HandleFunc("/job/run", handlers.JobRun).Methods("POST")
	r.HandleFunc("/profiles", handlers.ProfilesList)
	r.HandleFunc("/profile/new", handlers.ProfileNewGet).Methods("GET")
	r.HandleFunc("/profile/new", handlers.ProfileNewPost).Methods("POST", "PUT")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", handlers.ProfileEditGet).Methods("GET")
	r.HandleFunc("/profile/{id:[0-9]+}/edit", handlers.ProfileEditPost).Methods("POST", "PUT")
	r.HandleFunc("/storage_services", handlers.StorageServicesList)
	r.HandleFunc("/storage_service/new", handlers.StorageServiceNewGet).Methods("GET")
	r.HandleFunc("/storage_service/new", handlers.StorageServiceNewPost).Methods("POST", "PUT")
	r.HandleFunc("/storage_service/{id:[0-9]+}/edit", handlers.StorageServiceEditGet).Methods("GET")
	r.HandleFunc("/storage_service/{id:[0-9]+}/edit", handlers.StorageServiceEditPost).Methods("POST", "PUT")
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

func GetServerRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Dir(filename)
}

func GetImageRoot() string {
	return filepath.Join(GetServerRoot(), "static", "img")
}

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
