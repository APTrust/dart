package models_test

import (
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestTransferProtocolOptions(t *testing.T) {
	options := models.TransferProtocolOptions()
	require.Equal(t, len(models.TransferProtocols)+1, len(options[""]))
	for i, allowed := range models.TransferProtocols {
		assert.Equal(t, allowed, options[""][i+1].Id)
		assert.Equal(t, allowed, options[""][i+1].Val)
	}
}
