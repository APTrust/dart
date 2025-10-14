//go:build release

package server

import (
	"embed"
	"html/template"
	"io/fs"
	"net/http"
	"regexp"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

//go:embed views
var views embed.FS

//go:embed assets
var assets embed.FS

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

	loadHTMLFromEmbedFS(router, views, "*.html")
}

// Serve static assets from embedded FS in release build.
func initStaticRoutes(router *gin.Engine) {
	router.GET("/favicon.ico", func(c *gin.Context) {
		c.FileFromFS("assets/img/favicon.ico", http.FS(assets))
	})
	router.GET("/assets/*filepath", func(c *gin.Context) {
		c.FileFromFS(c.Request.URL.Path, http.FS(assets))
	})
}

// Next two functions courtest of https://github.com/gin-gonic/gin/issues/2795

// loadHTMLFromEmbedFS loads HTML templates from an embedded file system
func loadHTMLFromEmbedFS(engine *gin.Engine, embedFS embed.FS, pattern string) {
	root := template.New("")
	tmpl := template.Must(root, loadAndAddToRoot(engine.FuncMap, root, embedFS, pattern))
	engine.SetHTMLTemplate(tmpl)
}

// loadAndAddToRoot recursively loads and parses template files from embedded FS
func loadAndAddToRoot(funcMap template.FuncMap, rootTemplate *template.Template, embedFS embed.FS, pattern string) error {
	pattern = strings.ReplaceAll(pattern, ".", "\\.")
	pattern = strings.ReplaceAll(pattern, "*", ".*")

	err := fs.WalkDir(embedFS, ".", func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if matched, _ := regexp.MatchString(pattern, path); !d.IsDir() && matched {
			data, readErr := embedFS.ReadFile(path)
			if readErr != nil {
				return readErr
			}
			t := rootTemplate.New(path).Funcs(funcMap)
			if _, parseErr := t.Parse(string(data)); parseErr != nil {
				return parseErr
			}
			//fmt.Println("    template", path)
		}
		return nil
	})
	return err
}
