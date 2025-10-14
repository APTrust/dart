package controllers

import (
	"database/sql"
	"runtime/debug"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

func AbortWithErrorHTML(c *gin.Context, status int, err error) {
	logRequestError(c, status, err)
	c.HTML(status, "error/show.html", getResponseData(err))
	c.Abort()
}

func AbortWithErrorJSON(c *gin.Context, status int, err error) {
	logRequestError(c, status, err)
	c.JSON(status, getResponseData(err))
	c.Abort()
}

func AbortWithErrorModal(c *gin.Context, status int, err error) {
	logRequestError(c, status, err)
	c.HTML(status, "error/show_modal.html", getResponseData(err))
	c.Abort()
}

func getResponseData(err error) gin.H {
	stack := debug.Stack()
	errorMessage := err.Error()
	if err == sql.ErrNoRows {
		errorMessage = "Object not found."
	}
	data := gin.H{
		"error":      errorMessage,
		"stackTrace": string(stack),
	}
	return data
}

func logRequestError(c *gin.Context, status int, err error) {
	core.Dart.Log.Errorf("Returned status %d for %s %s", status, c.Request.Method, c.Request.URL.RequestURI())
	core.Dart.Log.Error(err.Error())
}
