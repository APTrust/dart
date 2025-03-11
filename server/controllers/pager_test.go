package controllers_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getPager(t *testing.T, perPage int) *controllers.Pager {
	var err error
	var _url = fmt.Sprintf("http://example.com/objects?page=4&per_page=%d", perPage)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = &http.Request{}
	c.Request.URL, err = url.Parse(_url)
	require.Nil(t, err)
	pager, err := controllers.NewPager(c, _url, 10)
	require.Nil(t, err)
	return pager
}

func TestNewPager(t *testing.T) {
	pager := getPager(t, 10)
	require.NotNil(t, pager)

	assert.Equal(t, 4, pager.Page)
	assert.Equal(t, 10, pager.PerPage)
	assert.Equal(t, 30, pager.QueryOffset)
	assert.Equal(t, 31, pager.ItemFirst)
}

func TestPagerSetCounts(t *testing.T) {
	pager := getPager(t, 10)
	require.NotNil(t, pager)

	pager.SetCounts(200, 10)
	assert.Equal(t, 200, pager.TotalItems)
	assert.Equal(t, 10, pager.ItemsInResultSet)
	assert.Equal(t, 40, pager.ItemLast)
	assert.Equal(t, "/objects?page=3&per_page=10", pager.PreviousLink)
	assert.Equal(t, "/objects?page=5&per_page=10", pager.NextLink)
}

func TestPagerPerPageLimit(t *testing.T) {
	pager := getPager(t, 100)
	assert.Equal(t, 100, pager.PerPage)

	// Max per page is 1000. Pager should
	// enforce this if user requests too
	// many items at once.
	pager = getPager(t, 999999)
	assert.Equal(t, 1000, pager.PerPage)
}
