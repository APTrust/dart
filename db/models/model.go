package models

import (
	"database/sql"
	"fmt"
	"github.com/APTrust/easy-store/util"
	"github.com/jmoiron/sqlx"
	"log"
	"reflect"
	"strings"
	"unicode"
)

// Model is the interface for all db models. It implements an PrimaryKey()
// method, which returns the model's database ID, simply for the
// convenience of some of the DB helper functions in this file.
type Model interface {
	// Errors returns a list of errors that occurred while saving
	// or validating the object.
	Errors() []string
	// PrimaryKey returns the model's primary key (id) value.
	PrimaryKey() int64
	// Save saves the object the database.
	Save(bool) bool
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
		placeholders[i] = ":" + colnames[i]
	}
	return placeholders
}

// Returns an insert statement for the given model.
func InsertStatement(model Model) string {
	cols := strings.Join(ColNames(model, false), ", ")
	placeholders := strings.Join(ColPlaceholders(model, false), ", ")
	return fmt.Sprintf("insert into %s (%s) values (%s)", model.TableName(), cols, placeholders)
}

// Returns an update statement for the given model.
func UpdateStatement(model Model) string {
	cols := ColNames(model, false)
	placeholders := ColPlaceholders(model, false)
	colValuePairs := make([]string, len(cols))
	for i := 0; i < len(cols); i++ {
		if cols[i] == "id" {
			continue
		}
		colValuePairs[i] = fmt.Sprintf("%s = %s", cols[i], placeholders[i])
	}
	return fmt.Sprintf("update %s set %s where id = :id", model.TableName(), strings.Join(colValuePairs, ", "))
}

// SaveStatement returns the appropriate save statement for the given
// model. If the model's id is zero, this returns an insert statement,
// otherwise, it returns an update.
func SaveStatement(model Model) string {
	if model.PrimaryKey() == 0 {
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
	return fmt.Sprintf("%s where id = :id", query)
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

func ExecCommand(command string, arg interface{}) (sql.Result, error) {
	if arg == nil {
		arg = map[string]interface{}{}
	}
	db := GetConnection(DEFAULT_CONNECTION)
	return db.NamedExec(command, arg)
}
