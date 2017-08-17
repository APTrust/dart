package models_test

/* NOTE: model_test.go contains the TestMain, setup, and teardown functions for this suite. */

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestBagSave(t *testing.T) {
	bag := FakeBag()
	bag.Id = 0
	ok := bag.Save(false)
	assert.True(t, ok)
	assert.NotEqual(t, 0, bag.Id)
}
