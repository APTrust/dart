package main

import (
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
)

var templates *template.Template

type TemplateData struct {
	Content            string
	CustomFooterScript string
	CustomHeaderScript string
	FooterContent      string
	PageTitle          string
}

func main() {
	CompileTemplates()
	http.Handle("/static/", http.FileServer(http.Dir(GetServerRoot())))
	http.Handle("/favicon.ico", http.FileServer(http.Dir(GetImageRoot())))
	http.HandleFunc("/", HandleRootRequest)
	log.Fatal(http.ListenAndServe(":8080", nil))
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
	log.Println(templateDir)
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
