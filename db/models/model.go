package models

import (
	"fmt"
	"reflect"
	"strings"
)

// Model is the interface for all db models. It implements an PrimaryKey()
// method, which returns the model's database ID, simply for the
// convenience of some of the DB helper functions in this file.
type Model interface {
	PrimaryKey() int
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
func InsertStatement(model Model, tableName string) string {
	cols := strings.Join(ColNames(model), ", ")
	placeholders := strings.Join(ColPlaceholders(model), ", ")
	return fmt.Sprintf("insert into %s (%s) values (%s)", tableName, cols, placeholders)
}

// Returns an update statement for the given model.
func UpdateStatement(model Model, tableName string) string {
	cols := ColNames(model)
	placeholders := ColPlaceholders(model)
	colValuePairs := make([]string, len(cols)-1)
	for i := 0; i < len(cols); i++ {
		if cols[i] == "id" {
			continue
		}
		colValuePairs[i] = fmt.Sprintf("%s = %s", cols[i], placeholders[i])
	}
	return fmt.Sprintf("update %s set %s where id = :id", tableName, strings.Join(colValuePairs, ", "))
}

// SaveStatement returns the appropriate save statement for the given
// model. If the model's id is zero, this returns an insert statement,
// otherwise, it returns an update.
func SaveStatement(model Model, tableName string) string {
	if model.PrimaryKey() == 0 {
		return InsertStatement(model, tableName)
	}
	return UpdateStatement(model, tableName)
}

// TODO: General find statement, takes map[string]interface{}
//       GetById statement
//       SelectStatement (returns select with no where)
//       WhereAll map[string]interface
//       WhereAny map[string]interface
