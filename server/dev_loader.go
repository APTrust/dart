//go:build !release

package server

import (
	"html/template"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// initTemplates loads templates and sets up template helper functions.
func initTemplates(router *gin.Engine) {

	// Note: We can't put workflowList in util with the
	// other template helpers because it creates a cyclical
	// import cycle between core and util. So we define the
	// body of that helper here inline.

	router.SetFuncMap(template.FuncMap{
		"add":            util.Add,
		"dateISO":        util.DateISO,
		"dateTimeISO":    util.DateTimeISO,
		"dateTimeUS":     util.DateTimeUS,
		"dateUS":         util.DateUS,
		"dict":           util.Dict,
		"dirStats":       util.DirStats,
		"displayDate":    util.DisplayDate,
		"escapeAttr":     util.EscapeAttr,
		"escapeHTML":     util.EscapeHTML,
		"fileIconFor":    util.FileIconFor,
		"humanSize":      util.HumanSize,
		"mod":            util.Mod,
		"strEq":          util.StrEq,
		"strStartsWith":  util.StrStartsWith,
		"truncate":       util.Truncate,
		"truncateMiddle": util.TruncateMiddle,
		"truncateStart":  util.TruncateStart,
		"unixToISO":      util.UnixToISO,
		"workflowList":   func() []core.NameIDPair { return core.ObjNameIdList(constants.TypeWorkflow) },
		"yesNo":          util.YesNo,
	})

	// Load the view templates
	// If we're running from main, templates will come
	// from ./views. When running tests, templates come
	// from ../../views because http tests run from web
	// from ../../../views for member api and admin api
	// sub directory.
	if util.FileExists("./server/views") {
		router.LoadHTMLGlob("./server/views/**/*.html")
	} else if util.FileExists("../server/views") {
		router.LoadHTMLGlob("../server/views/**/*.html")
	} else {
		router.LoadHTMLGlob("../../server/views/**/*.html")
	}
}

// Serve static assets local file system when running in developer mode.
func initStaticRoutes(router *gin.Engine) {
	router.StaticFile("/favicon.ico", "./server/assets/img/favicon.ico")
	router.Static("/assets", "./server/assets")
}
