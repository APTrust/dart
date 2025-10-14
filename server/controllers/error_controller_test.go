package controllers_test

import (
	"net/http"
	"net/http/httptest"
	"runtime"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/stretchr/testify/assert"
)

func TestAbortWithErrorHTML(t *testing.T) {
	expectedContent := []string{
		"Object not found.",
		"runtime/debug.Stack",
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/jobs/files/bad-uuid", nil)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)
	html := w.Body.String()
	for _, str := range expectedContent {
		assert.Contains(t, html, str)
	}
}

func TestAbortWithErrorJson(t *testing.T) {
	actualLogDir := core.Dart.Paths.LogDir
	defer func() {
		core.Dart.Paths.LogDir = actualLogDir
	}()
	core.Dart.Paths.LogDir = "--this-dir-does-not-exist--"

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/open_log", nil)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	responseText := w.Body.String()
	expected := `{"error":"open --this-dir-does-not-exist--: no such file or directory","status":"500"}`
	if runtime.GOOS == "windows" {
		expected = `{"error":"open --this-dir-does-not-exist--: The system cannot find the file specified.","status":"500"}`
	}
	assert.Equal(t, expected, responseText)
}
