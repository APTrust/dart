package main

import (
	"bytes"
	"github.com/APTrust/easy-store/db/models"
	"github.com/APTrust/easy-store/util/testutil"
	"github.com/jmoiron/sqlx"
	"github.com/kirves/go-form-it"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

var templates *template.Template

type TemplateData struct {
	Content            template.HTML
	CustomFooterScript string
	CustomHeaderScript string
	FooterContent      string
	PageTitle          string
}

func main() {
	CompileTemplates()
	InitDBConnection()
	http.Handle("/static/", http.FileServer(http.Dir(GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))
	http.HandleFunc("/", HandleRootRequest)
	http.HandleFunc("/form", HandleFormRequest)

	http.HandleFunc("/profiles", HandleProfileRequest)

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
	data := TemplateData{}
	err := templates.ExecuteTemplate(w, "layout", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// Temp test method
func HandleFormRequest(w http.ResponseWriter, r *http.Request) {
	profile := models.BagItProfile{}
	form := forms.BootstrapFormFromModel(profile, forms.POST, "/form").Render()
	data := TemplateData{
		Content: form,
	}
	err := templates.ExecuteTemplate(w, "layout", data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func HandleProfileRequest(w http.ResponseWriter, r *http.Request) {
	profiles, _ := models.GetBagItProfiles("", []interface{}{})
	contentBuffer := bytes.NewBuffer(make([]byte, 0))
	templates.ExecuteTemplate(contentBuffer, "bagit-profile-list", profiles)
	data := TemplateData{
		Content: template.HTML(contentBuffer.String()),
	}
	err := templates.ExecuteTemplate(w, "layout", data)
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
