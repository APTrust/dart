package bagit_test

import (
	"github.com/APTrust/dart/bagit"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestSSValidate(t *testing.T) {
	service := &bagit.StorageService{}
	errors := service.Validate()
	assert.Equal(t, 2, len(errors))
}
