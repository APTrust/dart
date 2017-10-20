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
	r.HandleFunc("/job/{id:[0-9]+}/workflow_changed", handlers.JobWorkflowChanged).Methods("POST")
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
	r.HandleFunc("/workflows", handlers.WorkflowsList)
	r.HandleFunc("/workflow/new", handlers.WorkflowNewGet).Methods("GET")
	r.HandleFunc("/workflow/new", handlers.WorkflowNewPost).Methods("POST", "PUT")
	r.HandleFunc("/workflow/{id:[0-9]+}/edit", handlers.WorkflowEditGet).Methods("GET")
	r.HandleFunc("/workflow/{id:[0-9]+}/edit", handlers.WorkflowEditPost).Methods("POST", "PUT")
	http.Handle("/", r)

	go func() {
		time.Sleep(600 * time.Millisecond)
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
