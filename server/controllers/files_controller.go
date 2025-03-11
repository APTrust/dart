package controllers

import (
	"net/http"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /files/choose
func ShowFileChooser(c *gin.Context) {
	templateData, err := InitFileChooser(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.HTML(http.StatusOK, "partials/file_browser.html", templateData)
}

func InitFileChooser(c *gin.Context) (gin.H, error) {
	showHiddenFiles := c.Query("showHiddenFiles")
	directory := c.Query("directory")
	defaultPaths, err := core.Dart.Paths.DefaultPaths()
	if err != nil {
		return gin.H{}, err
	}
	parentDir, parentDirShortName := GetParentDir(directory)
	showParentDirLink := directory != "" && directory != parentDir
	showJumpMenu := directory != ""

	return gin.H{
		"parentDir":          parentDir,
		"parentDirShortName": parentDirShortName,
		"showParentDirLink":  showParentDirLink,
		"defaultPaths":       defaultPaths,
		"showJumpMenu":       showJumpMenu,
		"currentDir":         directory,
		"showHiddenFiles":    showHiddenFiles,
	}, nil
}
