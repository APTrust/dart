package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOptionList(t *testing.T) {
	values := []string{"Homer", "Barney", "Moe", "Apu"}
	options := models.OptionList(values)
	require.Equal(t, len(values)+1, len(options[""]))
	for i, allowed := range values {
		assert.Equal(t, allowed, options[""][i+1].Id)
		assert.Equal(t, allowed, options[""][i+1].Val)
	}
}
