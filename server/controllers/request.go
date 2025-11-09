package controllers

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

type Request struct {
	ginCtx         *gin.Context
	Action         string
	Errors         []error
	Handler        string
	ObjType        string
	Path           string
	PathAndQuery   string
	QueryResult    *core.QueryResult
	IsListResponse bool
	TemplateData   gin.H
}

// Regex to help us extract object type from handler name.
// E.g. AppSettingIndex -> AppSetting, StorageServiceEdit -> StorageService.
var routeSuffix = regexp.MustCompile(`Index|New|Save|Edit|Delete|GetReport|ShowJson$`)

func NewRequest(c *gin.Context) *Request {
	pathAndQuery := c.Request.URL.Path
	if c.Request.URL.RawQuery != "" {
		pathAndQuery = c.Request.URL.Path + "?" + c.Request.URL.RawQuery
	}
	request := &Request{
		ginCtx:         c,
		Errors:         make([]error, 0),
		IsListResponse: false,
		Path:           c.Request.URL.Path,
		PathAndQuery:   pathAndQuery,
		TemplateData:   DefaultTemplateData(c),
	}
	request.initFromHandlerName()
	request.loadObjects()
	return request
}

func (r *Request) HasErrors() bool {
	return len(r.Errors) > 0
}

func (r *Request) initFromHandlerName() {
	nameParts := strings.Split(r.ginCtx.HandlerName(), ".")
	if len(nameParts) > 1 {
		r.Handler = nameParts[len(nameParts)-1]
		if strings.HasSuffix(r.Handler, "Index") {
			r.IsListResponse = true
		}
		r.ObjType = routeSuffix.ReplaceAllString(r.Handler, "")
		r.Action = strings.Replace(r.Handler, r.ObjType, "", 1)
	}
}

func (r *Request) loadObjects() {
	pageNumber := r.QueryParamAsInt("page", 1)
	perPage := r.QueryParamAsInt("per_page", 25)
	objId := r.ginCtx.Param("id")
	if !r.IsListResponse {
		r.QueryResult = core.ObjFind(objId)
		r.TemplateData["objectExistsInDB"] = (r.QueryResult.ObjCount == 1)
		if r.QueryResult.Error != nil {
			r.Errors = append(r.Errors, r.QueryResult.Error)
			return
		}
		form, err := r.QueryResult.GetForm()
		if err != nil {
			r.Errors = append(r.Errors, err)
		} else {
			r.TemplateData["form"] = form
		}
	} else {
		defaultSortColumn := "obj_name"
		if r.ObjType == constants.TypeJob {
			defaultSortColumn = "updated_at desc"
		}
		orderBy := r.ginCtx.DefaultQuery("orderBy", defaultSortColumn)
		offset := (pageNumber - 1) * perPage
		r.QueryResult = core.ObjList(r.ObjType, orderBy, perPage, offset)
		if r.QueryResult.Error != nil {
			r.Errors = append(r.Errors, r.QueryResult.Error)
			return
		}
		pager, err := NewPager(r.ginCtx, r.Path, 25)
		if err != nil {
			r.Errors = append(r.Errors, err)
			return
		}
		pager.SetCounts(r.QueryResult.ObjCount, r.QueryResult.ResultCount())
		r.TemplateData["pager"] = pager
	}
}

func (r *Request) QueryParamAsInt(paramName string, defaultValue int) int {
	value, err := strconv.Atoi(r.ginCtx.Query(paramName))
	if err != nil {
		value = defaultValue
	}
	return value
}

func GetHelpUrl(c *gin.Context) string {
	helpUrl := "https://aptrust.github.io/dart-docs/users/getting_started/"
	handler := ""
	nameParts := strings.Split(c.HandlerName(), ".")
	if len(nameParts) > 1 {
		handler = nameParts[len(nameParts)-1]
	}
	if handler != "" {
		helpUrl = fmt.Sprintf("%s%s", BaseHelpUrl, HelpUrlFor[handler])
	}
	return helpUrl
}

func DefaultTemplateData(c *gin.Context) gin.H {
	return gin.H{
		"currentUrl":  c.Request.URL.Path,
		"backUrl":     c.Request.Referer(),
		"helpUrl":     GetHelpUrl(c),
		"showAsModal": c.Query("modal") == "true",
		"flash":       GetFlashCookie(c),
	}
}
