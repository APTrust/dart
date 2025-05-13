package controllers

import (
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /remote_repositories/delete/:id
// POST /remote_repositories/delete/:id
func RemoteRepositoryDelete(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	err := core.ObjDelete(request.QueryResult.RemoteRepository())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted remote repo %s", request.QueryResult.RemoteRepository().Name))
	c.Redirect(http.StatusFound, "/remote_repositories")
}

// GET /remote_repositories/edit/:id
func RemoteRepositoryEdit(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["showTestButton"] = request.QueryResult.RemoteRepository().Validate()
	c.HTML(http.StatusOK, "remote_repository/form.html", request.TemplateData)
}

// GET /remote_repositories
func RemoteRepositoryIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.RemoteRepositories
	c.HTML(http.StatusOK, "remote_repository/list.html", request.TemplateData)
}

// GET /remote_repositories/new
func RemoteRepositoryNew(c *gin.Context) {
	repo := core.NewRemoteRepository()
	data := gin.H{
		"form":                 repo.ToForm(),
		"suppressDeleteButton": true,
		"helpUrl":              GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "remote_repository/form.html", data)
}

// PUT /remote_repositories/edit/:id
// POST /remote_repositories/edit/:id
// POST /remote_repositories/new
func RemoteRepositorySave(c *gin.Context) {
	repo := &core.RemoteRepository{}
	err := c.Bind(repo)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	err = core.ObjSave(repo)
	if err != nil {
		objectExistsInDB, _ := core.ObjExists(repo.ID)
		data := gin.H{
			"form":             repo.ToForm(),
			"objectExistsInDB": objectExistsInDB,
			"helpUrl":          GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "remote_repository/form.html", data)
		return
	}
	SetFlashCookie(c, "Remote repo settings saved.")
	c.Redirect(http.StatusFound, "/remote_repositories")
}

// RemoteRepositoryTestConnection tests a connection to a remote
// repository, so user can be sure they have everything configured
// correctly.
//
// POST /remote_repositories/test/:id
func RemoteRepositoryTestConnection(c *gin.Context) {
	repo := &core.RemoteRepository{}
	err := c.Bind(repo)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	// Save, because user may have updated URL or credentials.
	// If save fails, continue with test.
	core.ObjSave(repo)

	status := http.StatusOK
	succeeded := true
	message := fmt.Sprintf("It worked! We got a successful response from %s.", repo.Url)
	if repo.UserID != "" && repo.APIToken != "" {
		err = repo.TestConnection()
	} else {
		err = fmt.Errorf("Can't test connection because user id or API key is missing.")
	}
	if err != nil {
		message = fmt.Sprintf("Connection failed: %s", err.Error())
		succeeded = false
		status = http.StatusBadRequest
	}
	data := gin.H{
		"repo":      repo,
		"message":   message,
		"succeeded": succeeded,
		"helpUrl":   GetHelpUrl(c),
	}
	c.HTML(status, "remote_repository/test.html", data)
}
