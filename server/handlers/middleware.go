package handlers

import (
	"github.com/gorilla/schema"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
)

type Environment struct {
	DB        *gorm.DB
	Decoder   *schema.Decoder
	Templates *template.Template
}

func NewEnvironment(pathToServerRoot, dbFilePath string) *Environment {
	return &Environment{
		DB:        initDBConnection(dbFilePath),
		Decoder:   schema.NewDecoder(),
		Templates: compileTemplates(pathToServerRoot),
	}
}

func compileTemplates(pathToServerRoot string) *template.Template {
	templateDir, _ := filepath.Abs(filepath.Join(pathToServerRoot, "templates", "*.html"))
	log.Println("Loading templates:", templateDir)
	return template.Must(template.ParseGlob(templateDir))
}

// TODO: This is also used by the easy_store_setup app.
// Put it on one place, and don't rely on testutil.GetPathToSchema()
// as that file and directory exist in dev mode only, and users
// won't have them.
func initDBConnection(dbFilePath string) *gorm.DB {
	db, err := gorm.Open("sqlite3", dbFilePath)
	if err != nil {
		panic(err.Error())
	}
	db.LogMode(true)
	return db
}

// WrapHandler wraps a custom HTTP request handler inside a standard Go
// HTTP request handler, and returns the standard handler. We wrap
// the handler functions for a number of reasons:
//
// First, we want to pass in some resources that all handlers need,
// such as the connection to the database and a reference to the
// HTML templates.
//
// Second we want to standardize logging and error handling in a
// single location, so we want our custom HTTP handlers to quit
// early and return an error when necessary. The standard Go HTTP
// handlers don't return anything.
//
// Third, this wrapper allows us to inject middleware as needed.
// While Go's standard middleware pattern already allows this, we do
// need this custom implementation if we want to be able to pass
// environment data and receive errors.
func WrapHandler(env *Environment, handler func(env *Environment, w http.ResponseWriter, r *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logRequest(r)
		err := handler(env, w, r)
		if err != nil {
			HandleError(w, r, err)
		}
	})
}
