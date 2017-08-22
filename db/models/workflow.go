package models

import (
	"strings"
)

// Workflow holds information about how a bag should be built and
// where it should be sent.
type Workflow struct {
	Id               int64  `db:"id" form_options:"skip"`
	Name             string `db:"name"`
	Description      string `db:"description"`
	ProfileId        *int   `db:"profile_id" form_widget:"hidden"`
	StorageServiceId *int   `db:"storage_service_id" form_widget:"hidden"`
	errors           []string
}

// GetWorkflow returns the workflow with the specified id, or an error if the
// workflow does not exist.
func GetWorkflow(id int64) (*Workflow, error) {
	workflow := &Workflow{Id: id}
	query := SelectByIdQuery(workflow)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Get(workflow, query, id)
	return workflow, err
}

// GetWorkflows returns the workflows matching the criteria specified in where.
// The values param should be a map of values reference in the
// where clause.
//
// For example:
//
// where := "name = ? and age = ?"
// values := []interface{} { "Billy Bob Thornton", 62 }
// workflows, err := GetWorkflows(where, values)
func GetWorkflows(where string, values []interface{}) ([]*Workflow, error) {
	workflow := &Workflow{}
	var query string
	if strings.TrimSpace(where) != "" {
		query = SelectWhere(workflow, where)
	} else {
		query = SelectQuery(workflow)
	}
	workflows := make([]*Workflow, 0)
	db := GetConnection(DEFAULT_CONNECTION)
	err := db.Select(&workflows, query, values...)
	return workflows, err
}

// Save saves the object to the database. If validate is true,
// it validates before saving. After a successful save, the object
// will have a non-zero Id. If this returns false, check Errors().
func (workflow *Workflow) Save(validate bool) bool {
	return SaveObject(workflow)
}

// GetId() returns this object's Id, to conform to the Model interface.
func (workflow *Workflow) GetId() int64 {
	return workflow.Id
}

// SetId() sets this object's Id.
func (workflow *Workflow) SetId(id int64) {
	workflow.Id = id
}

// TableName returns the name of the database table where this model's
// records are stored.
func (workflow *Workflow) TableName() string {
	return "workflows"
}

// Validate runs validation checks on the object and returns true if
// the object is valid. If this returns false, check Errors().
func (workflow *Workflow) Validate() bool {
	workflow.initErrors(true)
	return true
}

// Errors returns a list of errors that occurred after a call to Validate()
// or Save().
func (workflow *Workflow) Errors() []string {
	workflow.initErrors(false)
	return workflow.errors
}

// initErrors initializes the errors list. If param clearExistingList
// is true, it replaces the existing errors list with a blank list.
func (workflow *Workflow) initErrors(clearExistingList bool) {
	if workflow.errors == nil || clearExistingList {
		workflow.errors = make([]string, 0)
	}
}

// AddError adds an error message to the errors list.
func (workflow *Workflow) AddError(message string) {
	workflow.errors = append(workflow.errors, message)
}

func (workflow *Workflow) WorkflowBagItProfile() *BagItProfile {
	// Load from ProfileId, if that's not nil.
	return nil
}

func (workflow *Workflow) StorageService() *StorageService {
	// Load from StorageServiceId, if that's not nil.
	return nil
}
