package main

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/gorilla/mux"
	"github.com/gorilla/schema"
	"github.com/jmoiron/sqlx"
	"github.com/kirves/go-form-it"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"time"
)

var templates *template.Template
var decoder = schema.NewDecoder()

func main() {
	CompileTemplates()
	InitDBConnection()
	http.Handle("/static/", http.FileServer(http.Dir(GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))

	r := mux.NewRouter()
	r.HandleFunc("/", HandleRootRequest)
	r.HandleFunc("/bags", BagsList).Methods("GET")
	r.HandleFunc("/bag/{id:[0-9]+}", BagDetail).Methods("GET")
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
	http.Handle("/", r)

	go func() {
		time.Sleep(600 * time.Millisecond)
		OpenBrowser("http://localhost:8080")
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

func ProfileNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	profile := models.BagItProfile{}
	data["form"] = forms.BootstrapFormFromModel(profile, forms.POST, "/profile/new")
	err := templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileNewPost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		log.Println("Error:", err.Error())
	}
	profile := &models.BagItProfile{}
	err = decoder.Decode(profile, r.PostForm)
	if err != nil {
		log.Println("Error:", err.Error())
	}
	data := make(map[string]interface{})
	ok := profile.Save(true)
	postUrl := fmt.Sprintf("/profile/new")
	if !ok {
		data["errors"] = profile.Errors()
		postUrl = fmt.Sprintf("/profile/%d/edit", profile.Id)
	} else {
		data["success"] = "Profile has been saved."
	}
	data["form"] = forms.BootstrapFormFromModel(*profile, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfilesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	profiles, _ := models.GetBagItProfiles("", []interface{}{})
	data["items"] = profiles
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
	profile, _ := models.GetBagItProfile(int64(id))
	// log.Println(profile)
	postUrl := fmt.Sprintf("/profile/%d/edit", id)
	data := make(map[string]interface{})
	data["form"] = forms.BootstrapFormFromModel(*profile, forms.POST, postUrl)
	err := templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func ProfileEditPost(w http.ResponseWriter, r *http.Request) {
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
	profile.Id = int64(id)
	data := make(map[string]interface{})
	ok := profile.Save(true)
	if !ok {
		data["errors"] = profile.Errors()
	} else {
		data["success"] = "Profile has been saved."
	}
	postUrl := fmt.Sprintf("/profile/%d/edit", id)
	data["form"] = forms.BootstrapFormFromModel(*profile, forms.POST, postUrl)
	err = templates.ExecuteTemplate(w, "bagit-profile-form", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServicesList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	services, _ := models.GetStorageServices("", []interface{}{})
	data["items"] = services
	err := templates.ExecuteTemplate(w, "storage-service-list", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func StorageServiceNewGet(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	service := models.StorageService{}
	data["form"] = forms.BootstrapFormFromModel(service, forms.POST, "/storage_service/new")
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
	ok := service.Save(true)
	postUrl := fmt.Sprintf("/storage_service/new")
	if !ok {
		data["errors"] = service.Errors()
		postUrl = fmt.Sprintf("/storage_service/%d/edit", service.Id)
	} else {
		data["success"] = "Service has been saved."
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
	service, _ := models.GetStorageService(int64(id))
	// log.Println(service)
	postUrl := fmt.Sprintf("/storage_service/%d/edit", id)
	data := make(map[string]interface{})
	data["form"] = forms.BootstrapFormFromModel(*service, forms.POST, postUrl)
	err := templates.ExecuteTemplate(w, "storage-service-form", data)
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
	service.Id = int64(id)
	data := make(map[string]interface{})
	ok := service.Save(true)
	if !ok {
		data["errors"] = service.Errors()
	} else {
		data["success"] = "Storage Service has been saved."
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
	bags, _ := models.GetBags("", []interface{}{})
	data["items"] = bags
	err := templates.ExecuteTemplate(w, "bag-list", data)
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
	bag, _ := models.GetBag(int64(id))
	data["item"] = bag
	params := []interface{}{int64(id)}
	files, _ := models.GetFiles("bag_id = ?", params)
	data["items"] = files
	err := templates.ExecuteTemplate(w, "bag-detail", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func WorkflowsList(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	bags, _ := models.GetWorkflows("", []interface{}{})
	data["items"] = bags
	err := templates.ExecuteTemplate(w, "workflow-list", data)
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
	conn, err := sqlx.Connect("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	models.SetConnection(models.DEFAULT_CONNECTION, conn)
}
