package controllers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /about
func AboutShow(c *gin.Context) {
	logFile, err := core.Dart.Paths.LogFile()
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	tailCommand := fmt.Sprintf("tail -f %s", logFile)
	if runtime.GOOS == "windows" {
		tailCommand = fmt.Sprintf("powershell -command Get-Content %s -Wait", logFile)
	}

	appPath, err := os.Executable()
	if err != nil {
		core.Dart.Log.Warningf("Can't get app path: %v", err)
		appPath = "Unknown"
	}
	version := constants.Version
	if version == "" {
		version = "undefined"
	}

	templateData := gin.H{
		"version":      version,
		"appPath":      appPath,
		"userDataPath": core.Dart.Paths.DataDir,
		"logFilePath":  logFile,
		"tailCommand":  tailCommand,
		"helpUrl":      GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "about/index.html", templateData)
}

// GET /open_external
// This is an AJAX call.
// TODO: Make context-sensitive. Go to the right page!
func OpenExternalUrl(c *gin.Context) {
	externalUrl := c.Query("url")
	command := "open"
	if runtime.GOOS == "windows" {
		command = "start"
	} else if runtime.GOOS == "linux" {
		command = "xdg-open"
	}
	cmd := exec.Command(command, externalUrl)
	runCommand(c, cmd)
}

// GET /open_log
func OpenLog(c *gin.Context) {
	logFile, err := core.Dart.Paths.LogFile()
	if err != nil {
		data := map[string]string{
			"status": strconv.Itoa(http.StatusInternalServerError),
			"error":  err.Error(),
		}
		c.JSON(http.StatusInternalServerError, data)
		return
	}
	command := "open"
	if runtime.GOOS == "windows" {
		command = "start"
	}
	cmd := exec.Command(command, logFile)
	runCommand(c, cmd)
}

// GET /open_log_folder
func OpenLogFolder(c *gin.Context) {
	command := "open"
	if runtime.GOOS == "windows" {
		command = "start"
	}
	cmd := exec.Command(command, core.Dart.Paths.LogDir)
	runCommand(c, cmd)
}

// GET /open_data_folder
func OpenDataFolder(c *gin.Context) {
	command := "open"
	if runtime.GOOS == "windows" {
		command = "start"
	}
	cmd := exec.Command(command, core.Dart.Paths.DataDir)
	runCommand(c, cmd)
}

func runCommand(c *gin.Context, cmd *exec.Cmd) {
	err := cmd.Start()
	if err != nil {
		data := map[string]string{
			"status": strconv.Itoa(http.StatusInternalServerError),
			"error":  err.Error(),
		}
		c.JSON(http.StatusInternalServerError, data)
		return
	}
	data := map[string]string{
		"status": strconv.Itoa(http.StatusOK),
		"result": "OK",
	}
	c.JSON(http.StatusOK, data)
}
