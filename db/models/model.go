package models

import (
	"database/sql"
	"fmt"
	"github.com/APTrust/easy-store/util"
	"github.com/jmoiron/sqlx"
	"github.com/kirves/go-form-it/fields"
	"log"
	"reflect"
	"strconv"
	"strings"
	"unicode"
)

// Model is the interface for all db models.
type Model interface {
	// AddError adds an error message to the Errors() list
	AddError(string)
	// Errors returns a list of errors that occurred while saving
	// or validating the object.
	Errors() []string
	// GetId returns the model's primary key (id) value.
	GetId() int64
	// Save saves the object the database.
	Save(bool) bool
	// SetId sets the model's Id property.
	SetId(int64)
	// TableName returns the name of the database table in which
	// this model's data is stored.
	TableName() string
	// Validate returns true if the object contains valid data,
	// false otherwise. If it returns false, check the Errors()
	// function for a list of errors.
	Validate() bool
}

const DEFAULT_CONNECTION = "default connection"

var connections map[string]*sqlx.DB

// SetConnection sets the database connection associated with the specified
// name. When the application starts, it should set a connection named
// "default connection" to point to the SQLite3 database that holds all
// our app info.
func SetConnection(name string, db *sqlx.DB) {
	if connections == nil {
		connections = make(map[string]*sqlx.DB)
	}
	connections[name] = db
}

// GetConnection returns the connection with the specified name.
// The default connection, named "default", is used by all of the
// core models. The app will crash (on purpose) if you request a
// connection that hasn't been set using SetConnection.
func GetConnection(name string) *sqlx.DB {
	// Notice we don't crash during unit tests - util.IsTesting()
	if (connections == nil || connections[name] == nil) && !util.IsTesting() {
		log.Fatalf("Database connection '%s' has not been set", name)
	}
	return connections[name]
}

// Returns the column names of the given model.
func ColNames(model Model, includeId bool) []string {
	t := reflect.TypeOf(model).Elem()
	colnames := make([]string, 0)
	for i := 0; i < t.NumField(); i++ {
		fieldName := t.Field(i).Name
		if fieldName == "Id" && includeId == false {
			continue
		}
		// Include only settable (public) fields
		if unicode.IsUpper(rune(fieldName[0])) {
			colnames = append(colnames, t.Field(i).Tag.Get("db"))
		}
	}
	return colnames
}

// Returns column placeholders for the given model.
// These are the column names prefixed with a colon.
func ColPlaceholders(model Model, includeId bool) []string {
	colnames := ColNames(model, includeId)
	placeholders := make([]string, len(colnames))
	for i := 0; i < len(colnames); i++ {
		placeholders[i] = "?"
	}
	return placeholders
}

// Returns an insert statement for the given model.
func InsertStatement(model Model) string {
	cols := ColNames(model, false)
	placeholders := make([]string, len(cols))
	for i := 0; i < len(cols); i++ {
		if cols[i] == "id" {
			continue
		}
		placeholders[i] = fmt.Sprintf(":%s", cols[i])
	}
	return fmt.Sprintf("insert into %s (%s) values (%s)", model.TableName(),
		strings.Join(cols, ", "), strings.Join(placeholders, ", "))
}

// Returns an update statement for the given model.
func UpdateStatement(model Model) string {
	cols := ColNames(model, false)
	colValuePairs := make([]string, len(cols))
	for i := 0; i < len(cols); i++ {
		if cols[i] == "id" {
			continue
		}
		colValuePairs[i] = fmt.Sprintf("%s = %s", cols[i], ":"+cols[i])
	}
	return fmt.Sprintf("update %s set %s where id = :id", model.TableName(), strings.Join(colValuePairs, ", "))
}

// SaveStatement returns the appropriate save statement for the given
// model. If the model's id is zero, this returns an insert statement,
// otherwise, it returns an update.
func SaveStatement(model Model) string {
	if model.GetId() == 0 {
		return InsertStatement(model)
	}
	return UpdateStatement(model)
}

// SelectQuery returns the basic select statement for the specified model, with
// no where clause.
func SelectQuery(model Model) string {
	cols := strings.Join(ColNames(model, true), ", ")
	return fmt.Sprintf("select %s from %s", cols, model.TableName())
}

// SelectByIdQuery returns the query to select a row from the model's
// table by Id.
func SelectByIdQuery(model Model) string {
	query := SelectQuery(model)
	return fmt.Sprintf("%s where id = ?", query)
}

// Select returns a model's select statement with the specified where clause.
func SelectWhere(model Model, whereClause string) string {
	query := SelectQuery(model)
	return fmt.Sprintf("%s where %s", query, whereClause)
}

// AndAll returns a string of SQL conditions in which all name-value
// params are ANDed together. For example:
//
// params["name"] = "Joe"
// params["age"] = 34
// conditions := AndAll(params)
//
// conditions -> " (name = :name and age = :age) "
func AndAll(params map[string]interface{}) string {
	paramPairs := make([]string, len(params))
	i := 0
	for key := range params {
		paramPairs[i] = fmt.Sprintf("%s = :%s", key, key)
		i++
	}
	return fmt.Sprintf("(%s)", strings.Join(paramPairs, " and "))
}

// AndAll returns a string of SQL conditions in which all name-value
// params are ORed together. For example:
//
// params["name"] = "Joe"
// params["age"] = 34
// conditions := OrAll(params)
//
// conditions -> " (name = :name or age = :age) "
func OrAll(params map[string]interface{}) string {
	paramPairs := make([]string, len(params))
	i := 0
	for key := range params {
		paramPairs[i] = fmt.Sprintf("%s = :%s", key, key)
		i++
	}
	return fmt.Sprintf("(%s)", strings.Join(paramPairs, " or "))
}

// ExecCommand runs a SQL command and returns the result.
func ExecCommand(command string, arg interface{}) (sql.Result, error) {
	if arg == nil {
		arg = map[string]interface{}{}
	}
	db := GetConnection(DEFAULT_CONNECTION)
	return db.NamedExec(command, arg)
}

// SaveObject saves model to the database and returns model
// with its Id property filled in.
func SaveObject(model Model) bool {
	if !model.Validate() {
		return false
	}
	statement := SaveStatement(model)

	// DEBUG
	// log.Println(statement, model)

	db := GetConnection(DEFAULT_CONNECTION)
	result, err := db.NamedExec(statement, model)
	if err != nil {
		model.AddError(err.Error())
		return false
	}
	id, err := result.LastInsertId()
	if err != nil {
		model.AddError(err.Error())
		return false
	}
	model.SetId(id)
	return true
}

func GetOptions(objType string) []fields.InputChoice {
	options := make([]fields.InputChoice, 0)
	if objType == "BagItProfile" {
		profiles, _ := GetBagItProfiles("", []interface{}{}, "order by name")
		for _, p := range profiles {
			id := strconv.FormatInt(p.Id, 10)
			options = append(options, fields.InputChoice{id, p.Name})
		}
	} else if objType == "StorageService" {
		services, _ := GetStorageServices("", []interface{}{}, "order by name")
		for _, s := range services {
			id := strconv.FormatInt(s.Id, 10)
			options = append(options, fields.InputChoice{id, s.Name})
		}
	}
	return options
}
