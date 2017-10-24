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

type CustomHandler interface {
	HandleRequest(env *Environment, w http.ResponseWriter, r *http.Request) error
}

func WrapHandler(env *Environment, customHandler CustomHandler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logRequest(r)
		err := customHandler.HandleRequest(env, w, r)
		if err != nil {
			HandleError(w, r, err)
		}
	})
}
