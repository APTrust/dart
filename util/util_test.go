package util_test

import (
	"github.com/APTrust/dart/util"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io/ioutil"
	"os"
	"testing"
	"time"
)

type SampleStruct struct {
	Id      int
	Strings []string
	Floats  []float64
	Time    time.Time
}

func TestStringListContains(t *testing.T) {
	list := []string{"apple", "orange", "banana"}
	assert.True(t, util.StringListContains(list, "orange"))
	assert.False(t, util.StringListContains(list, "wedgie"))
	// Don't panic on nil list
	assert.False(t, util.StringListContains(nil, "mars"))
}

func TestHumanSize(t *testing.T) {
	assert.Equal(t, "999.00 bytes", util.HumanSize(999))
	assert.Equal(t, "293.51 KB", util.HumanSize(300553))
	assert.Equal(t, "830.55 MB", util.HumanSize(870898776))
	assert.Equal(t, "21.74 GB", util.HumanSize(23346677876))
	assert.Equal(t, "24.87 TB", util.HumanSize(27346677876776))
}

func TestJsonDumpAndLoad(t *testing.T) {
	tempfile, err := ioutil.TempFile("", "json_util_test")
	if tempfile != nil {
		tempfile.Close()
	}
	defer os.Remove(tempfile.Name())
	require.Nil(t, err)
	obj := SampleStruct{
		Id:      1234,
		Strings: []string{"one", "two", "three"},
		Floats:  []float64{float64(1.33), float64(2.67)},
		Time:    time.Now().UTC(),
	}
	testDumpJson(t, tempfile.Name(), obj)
	testLoadJson(t, tempfile.Name(), obj)
}

func testDumpJson(t *testing.T, tempfile string, obj SampleStruct) {
	err := util.DumpJson(tempfile, obj)
	require.Nil(t, err)
}

func testLoadJson(t *testing.T, tempfile string, obj SampleStruct) {
	sample := &SampleStruct{}
	err := util.LoadJson(tempfile, sample)
	require.Nil(t, err)
	assert.Equal(t, obj.Id, sample.Id)
	assert.Equal(t, len(obj.Strings), len(sample.Strings))
	assert.Equal(t, len(obj.Floats), len(sample.Floats))
	assert.Equal(t, obj.Time, sample.Time)
}
