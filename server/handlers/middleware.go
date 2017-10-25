package handlers

import (
	"github.com/gorilla/schema"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
	"html/template"
	"io"
	"log"
	"path/filepath"
)

type Environment struct {
	DB        *gorm.DB
	Decoder   *schema.Decoder
	Templates *template.Template
}

func NewEnvironment(pathToServerRoot, dbFilePath string) *Environment {
	// Tell decoder to ignore irrelevant form items like submitButton
	decoder := schema.NewDecoder()
	decoder.IgnoreUnknownKeys(true)
	return &Environment{
		DB:        initDBConnection(dbFilePath),
		Decoder:   decoder,
		Templates: compileTemplates(pathToServerRoot),
	}
}

// func (env *Environment) Decode(dst interface{}, src map[string][]string) error {
//	return WrapErr(env.Decoder.Decode(dst, src))
// }

func (env *Environment) ExecTemplate(w io.Writer, name string, data interface{}) error {
	return WrapErr(env.Templates.ExecuteTemplate(w, name, data))
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
