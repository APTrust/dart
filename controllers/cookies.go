package controllers

import (
	"github.com/APTrust/dart-runner/constants"
	"github.com/gin-gonic/gin"
)

func SetFlashCookie(c *gin.Context, message string) {
	c.SetCookie(constants.FlashCookieName, message, 2, "/", "localhost", false, false)
}

func GetFlashCookie(c *gin.Context) string {
	message, _ := c.Cookie(constants.FlashCookieName)
	return message
}
