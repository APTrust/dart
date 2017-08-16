package models

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	"log"
	"reflect"
	"strings"
)

// Model is the interface for all db models. It implements an PrimaryKey()
// method, which returns the model's database ID, simply for the
// convenience of some of the DB helper functions in this file.
type Model interface {
	// PrimaryKey returns the model's primary key (id) value.
	PrimaryKey() int
	// TableName returns the name of the database table in which
	// this model's data is stored.
	TableName() string
}

const DEFAULT = "default"

var connections map[string]*sqlx.DB

// SetConnection sets the database connection associated with the specified
// name. When the application starts, it should set a connection named
// "default" to point to the SQLite3 database that holds all our app info.
func SetConnection(name string, db *sqlx.DB) {
	if connections == nil {
		connections = make(map[string]*sqlx.DB)
	}
	connections[name] = db
}

// GetConnection returns the connection with the specified name.
// The default connection, named "default", is used by all of the
// core models.
func GetConnection(name string) *sqlx.DB {
	if connections == nil || connections[name] == nil {
		log.Fatal("Database connection '%s' has not been set", name)
	}
	return connections[name]
}

// Returns the column names of the given model.
func ColNames(model Model) []string {
	t := reflect.TypeOf(model)
	colnames := make([]string, t.NumField())
	for i := 0; i < t.NumField(); i++ {
		colnames[i] = t.Field(i).Name
	}
	return colnames
}

// Returns column placeholders for the given model.
// These are the column names prefixed with a colon.
func ColPlaceholders(model Model) []string {
	colnames := ColNames(model)
	placeholders := make([]string, len(colnames))
	for i := 0; i < len(colnames); i++ {
		placeholders[i] = ":" + colnames[i]
	}
	return placeholders
}

// Returns an insert statement for the given model.
func InsertStatement(model Model) string {
	cols := strings.Join(ColNames(model), ", ")
	placeholders := strings.Join(ColPlaceholders(model), ", ")
	return fmt.Sprintf("insert into %s (%s) values (%s)", model.TableName(), cols, placeholders)
}

// Returns an update statement for the given model.
func UpdateStatement(model Model) string {
	cols := ColNames(model)
	placeholders := ColPlaceholders(model)
	colValuePairs := make([]string, len(cols)-1)
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
	cols := strings.Join(ColNames(model), ", ")
	return fmt.Sprintf("select %s from %s ", cols, model.TableName())
}

// SelectByIdQuery returns the query to select a row from the model's
// table by Id.
func SelectByIdQuery(model Model) string {
	query := SelectQuery(model)
	return fmt.Sprintf("%s where id = :id ", query, model.PrimaryKey())
}

// Select returns a model's select statement with the specified conditions
// in the where clause.
func SelectWhere(model Model, conditions string) string {
	query := SelectQuery(model)
	return fmt.Sprintf("%s where %s ", query, conditions)
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
		paramPairs[i] = fmt.Sprintf("%s = :%s", key)
		i++
	}
	return fmt.Sprintf(" (%s) ", strings.Join(paramPairs, " and "))
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
		paramPairs[i] = fmt.Sprintf("%s = :%s", key)
		i++
	}
	return fmt.Sprintf(" (%s) ", strings.Join(paramPairs, " or "))
}
