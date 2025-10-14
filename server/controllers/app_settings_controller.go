package controllers

import (
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// DELETE /app_settings/delete/:id
// POST /app_settings/delete/:id
func AppSettingDelete(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	err := core.ObjDelete(request.QueryResult.AppSetting())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted app setting %s", request.QueryResult.AppSetting()))
	c.Redirect(http.StatusFound, "/app_settings")
}

// GET /app_settings/edit/:id
func AppSettingEdit(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	c.HTML(http.StatusOK, "app_setting/form.html", request.TemplateData)
}

// GET /app_settings
func AppSettingIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.AppSettings
	c.HTML(http.StatusOK, "app_setting/list.html", request.TemplateData)
}

// GET /app_settings/new
func AppSettingNew(c *gin.Context) {
	setting := core.NewAppSetting("", "")
	data := gin.H{
		"form":                 setting.ToForm(),
		"suppressDeleteButton": true,
		"helpUrl":              GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "app_setting/form.html", data)
}

// PUT /app_settings/edit/:id
// POST /app_settings/edit/:id
// POST /app_settings/new
func AppSettingSave(c *gin.Context) {
	setting := &core.AppSetting{}

	// When saving, if user is editing an existing setting,
	// retrieve the DB object and edit that, so we don't lose
	// properties like Help and Choices.
	id := c.Params.ByName("id")
	if id != "" {
		result := core.ObjFind(id)
		if result.Error == nil && result.AppSetting() != nil {
			setting = result.AppSetting()
		}
	}
	err := c.Bind(setting)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	err = core.ObjSave(setting)
	if err != nil {
		objectExistsInDB, _ := core.ObjExists(setting.ID)
		data := gin.H{
			"form":             setting.ToForm(),
			"objectExistsInDB": objectExistsInDB,
			"helpUrl":          GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "app_setting/form.html", data)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Saved setting %s", setting.Name))
	c.Redirect(http.StatusFound, "/app_settings")
}
