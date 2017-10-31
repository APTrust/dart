package models

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"strconv"
)

type Workflow struct {
	gorm.Model          `form_options:"skip"`
	Name                string
	Description         string
	SerializationFormat string         `form_widget:"select"`
	BagItProfileID      uint           `form_widget:"select"`
	BagItProfile        BagItProfile   `form_options:"skip"`
	StorageServiceID    uint           `form_widget:"select"`
	StorageService      StorageService `form_options:"skip"`
}

// WorkflowLoad loads a workflow without any of its relations.
func WorkflowLoad(db *gorm.DB, id uint) (*Workflow, error) {
	workflow := &Workflow{}
	err := db.First(workflow, id).Error
	return workflow, err
}

// WorkflowLoadWithRelations loads a workflow with all of its relations
// and all of their sub-relations, all the way down.
func WorkflowLoadWithRelations(db *gorm.DB, id uint) (*Workflow, error) {
	workflow := &Workflow{}
	err := db.Preload("StorageService").First(&workflow, id).Error
	if err == nil {
		err = db.Preload("DefaultTagValues").
			First(&workflow.BagItProfile, workflow.BagItProfileID).Error
	}
	return workflow, err
}

// WorkflowOptions returns a list of choices to populate an HTML
// select list with all available workflows.
func WorkflowOptions(db *gorm.DB) []Choice {
	choices := make([]Choice, 1)
	choices[0] = Choice{Value: "", Label: ""}
	workflows := make([]Workflow, 0)
	db.Select("id, name").Find(&workflows).Order("name")
	for _, workflow := range workflows {
		choices = append(choices, Choice{
			Value: strconv.FormatUint(uint64(workflow.ID), 10),
			Label: workflow.Name})
	}
	return choices
}
