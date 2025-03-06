package controllers_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart/v3/server"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// dartServer is an instance of our server used for testing.
// All of our HTTP GET and POST tests will run against this.
var dartServer *gin.Engine

func init() {
	dartServer = server.InitAppEngine(true)
}

// StreamRecorder is a special instance of
// httptest.ResponseRecorder that supports CloseNotify
// so we can test endpoints that generate server-sent
// events.
type StreamRecorder struct {
	*httptest.ResponseRecorder
	closeChannel chan bool
	EventCount   int
	ResultEvent  *core.EventMessage
	LastEvent    *core.EventMessage
	mutex        sync.RWMutex
}

func (r *StreamRecorder) CloseNotify() <-chan bool {
	return r.closeChannel
}

func (r *StreamRecorder) Write(data []byte) (int, error) {
	r.mutex.Lock()
	r.EventCount += 1
	eventMessage := &core.EventMessage{}
	err := json.Unmarshal(data, eventMessage)
	if err == nil {
		if eventMessage.JobResult != nil {
			r.ResultEvent = eventMessage
		}
		if eventMessage.EventType == constants.EventTypeDisconnect {
			r.LastEvent = eventMessage
			r.close()
			r.Flushed = true
		}
	}
	r.mutex.Unlock()
	return r.ResponseRecorder.Write(data)
}

func (r *StreamRecorder) WriteString(data []byte) (int, error) {
	return r.Write([]byte(data))
}

func (r *StreamRecorder) close() {
	r.closeChannel <- true
}

func NewStreamRecorder() *StreamRecorder {
	return &StreamRecorder{
		httptest.NewRecorder(),
		make(chan bool, 1),
		0,
		nil,
		nil,
		sync.RWMutex{},
	}
}

type PostTestSettings struct {
	EndpointUrl              string
	Params                   url.Values
	ExpectedResponseCode     int
	ExpectedRedirectLocation string
	ExpectedContent          []string
}

func AssertContainsAllStrings(html string, expected []string) (allFound bool, notFound []string) {
	allFound = true
	for _, expectedString := range expected {
		if !strings.Contains(html, expectedString) {
			allFound = false
			notFound = append(notFound, expectedString)
		}
	}
	return allFound, notFound
}

func NewPostRequest(endpointUrl string, params url.Values) (*http.Request, error) {
	req, err := http.NewRequest(http.MethodPost, endpointUrl, strings.NewReader(params.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Content-Length", strconv.Itoa(len(params.Encode())))
	return req, err
}

func GetUrl(t *testing.T, endpointUrl string) string {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, endpointUrl, nil)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	return w.Body.String()
}

func PostUrl(t *testing.T, settings PostTestSettings) string {
	w := httptest.NewRecorder()
	req, err := NewPostRequest(settings.EndpointUrl, settings.Params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, settings.ExpectedResponseCode, w.Code)
	if settings.ExpectedRedirectLocation != "" {
		assert.Equal(t, settings.ExpectedRedirectLocation, w.Header().Get("Location"))
	}
	return w.Body.String()
}

func DoSimpleGetTest(t *testing.T, endpointUrl string, expected []string) {
	html := GetUrl(t, endpointUrl)
	ok, notFound := AssertContainsAllStrings(html, expected)
	if !ok {
		fmt.Println(html)
	}
	assert.True(t, ok, "Missing from page %s: %v", endpointUrl, notFound)
}

func DoSimplePostTest(t *testing.T, settings PostTestSettings) {
	html := PostUrl(t, settings)
	if len(settings.ExpectedContent) > 0 {
		ok, notFound := AssertContainsAllStrings(html, settings.ExpectedContent)
		assert.True(t, ok, "Missing from page %s: %v", settings.EndpointUrl, notFound)
	}
}

// DoPostTestWithRedirect posts data, follows the redirect, and then checks
// the content of the redirect page to ensure it contains expected content.
func DoPostTestWithRedirect(t *testing.T, settings PostTestSettings) {
	w := httptest.NewRecorder()
	req, err := NewPostRequest(settings.EndpointUrl, settings.Params)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, settings.ExpectedResponseCode, w.Code)
	if settings.ExpectedRedirectLocation != "" {
		assert.Equal(t, settings.ExpectedRedirectLocation, w.Header().Get("Location"))
	}
	// Follow the redirect URL and see if it contains the expected content.
	redirectUrl := w.Header().Get("Location")
	require.NotEmpty(t, redirectUrl)
	DoSimpleGetTest(t, redirectUrl, settings.ExpectedContent)
}

// DoGetTestWithRedirect posts data, follows the redirect, and then checks
// the content of the redirect page to ensure it contains expected content.
func DoGetTestWithRedirect(t *testing.T, endpointUrl, redirectPrefix string, expectedContent []string) {
	w := httptest.NewRecorder()
	req, err := http.NewRequest(http.MethodGet, endpointUrl, nil)
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusFound, w.Code)
	if redirectPrefix != "" {
		assert.True(t, strings.HasPrefix(w.Header().Get("Location"), redirectPrefix))
	}
	// Follow the redirect URL and see if it contains the expected content.
	redirectUrl := w.Header().Get("Location")
	require.NotEmpty(t, redirectUrl)
	DoSimpleGetTest(t, redirectUrl, expectedContent)
}
