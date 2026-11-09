package controllers_test

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// These tests make sure that actions which previously gave no
// confirmation now set a flash message. The next page displays the
// message and announces it to screen readers (accessibility,
// issues #581 and #583).

// getFlashMessage returns the decoded flash message set on the
// response, or an empty string if there isn't one.
func getFlashMessage(t *testing.T, w *httptest.ResponseRecorder) string {
	for _, cookie := range w.Result().Cookies() {
		if cookie.Name == constants.FlashCookieName {
			message, err := url.QueryUnescape(cookie.Value)
			require.Nil(t, err)
			return message
		}
	}
	return ""
}

func TestFlashCookies(t *testing.T) {
	defer core.ClearDartTable()
	saveTestProfiles(t)

	// Creating a profile redirects to the edit page, which
	// should show the confirmation.
	params := url.Values{}
	params.Set("BaseProfileID", constants.ProfileIDAPTrust)
	w := httptest.NewRecorder()
	req, err := NewPostRequest("/profiles/new", params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	require.Equal(t, http.StatusFound, w.Code)
	assert.Equal(t, "Created a new BagIt profile", getFlashMessage(t, w))

	location := w.Header().Get("Location")
	require.True(t, strings.HasPrefix(location, "/profiles/edit/"))
	profileID := strings.TrimPrefix(location, "/profiles/edit/")

	// Adding a tag file is an AJAX request that returns JSON. The
	// flash cookie comes back with the JSON, and the page the browser
	// goes to next shows the confirmation.
	params = url.Values{}
	params.Set("Name", "test-tag-file.txt")
	w = httptest.NewRecorder()
	req, err = NewPostRequest("/profiles/new_tag_file/"+profileID, params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "Added tag file test-tag-file.txt", getFlashMessage(t, w))
}
