package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestChoiceList(t *testing.T) {
	values := []string{"Homer", "Barney", "Moe", "Apu"}
	choices := models.ChoiceList(values)
	require.Equal(t, len(values)+1, len(choices))
	for i, allowed := range values {
		assert.Equal(t, allowed, choices[i+1].Value)
		assert.Equal(t, allowed, choices[i+1].Label)
	}
}
