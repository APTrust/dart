package controllers

import (
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /storage_services/delete/:id
// POST /storage_services/delete/:id
func StorageServiceDelete(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	err := core.ObjDelete(request.QueryResult.StorageService())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted storage service %s", request.QueryResult.StorageService().Name))
	c.Redirect(http.StatusFound, "/storage_services")
}

// GET /storage_services/edit/:id
func StorageServiceEdit(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["showTestButton"] = request.QueryResult.StorageService().Validate()
	c.HTML(http.StatusOK, "storage_service/form.html", request.TemplateData)
}

// GET /storage_services
func StorageServiceIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.StorageServices
	c.HTML(http.StatusOK, "storage_service/list.html", request.TemplateData)
}

// GET /storage_services/new
func StorageServiceNew(c *gin.Context) {
	ss := core.NewStorageService()
	data := gin.H{
		"form":                 ss.ToForm(),
		"suppressDeleteButton": true,
		"helpUrl":              GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "storage_service/form.html", data)
}

// PUT /storage_services/edit/:id
// POST /storage_services/edit/:id
// POST /storage_services/new
func StorageServiceSave(c *gin.Context) {
	ss := &core.StorageService{}
	err := c.Bind(ss)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	err = core.ObjSave(ss)
	if err != nil {
		objectExistsInDB, _ := core.ObjExists(ss.ID)
		data := gin.H{
			"form":             ss.ToForm(),
			"objectExistsInDB": objectExistsInDB,
			"showTestButton":   false,
			"helpUrl":          GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "storage_service/form.html", data)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Saved storage service %s", ss.Name))
	c.Redirect(http.StatusFound, "/storage_services")
}

// POST /storage_services/test/:id
func StorageServiceTestConnection(c *gin.Context) {
	ss := &core.StorageService{}
	err := c.Bind(ss)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	// Save this, because the user has likely been adjusting
	// hostname, credentials, or other attributes. But if the
	// save fails, continue with the test anyway.
	core.ObjSave(ss)

	status := http.StatusOK
	result := "Connection succeeded!"
	err = ss.TestConnection()
	if err != nil {
		status = http.StatusInternalServerError
		result = err.Error()
	}
	data := gin.H{
		"ss":      ss,
		"result":  result,
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(status, "storage_service/test.html", data)
}
