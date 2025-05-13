package controllers

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BagItProfileCreate creates a new Profile.
// Handles submission of new Profile form.
// POST /profiles/new
func BagItProfileCreate(c *gin.Context) {
	baseProfileID := c.PostForm("BaseProfileID")
	if baseProfileID == "" {
		baseProfileID = constants.EmptyProfileID
	}
	result := core.ObjFind(baseProfileID)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, result.Error)
		return
	}
	newProfile := core.BagItProfileClone(result.BagItProfile())
	newProfile.BaseProfileID = baseProfileID
	newProfile.Name = fmt.Sprintf("New profile based on %s %s", result.BagItProfile().Name, time.Now().Format(time.Stamp))
	err := core.ObjSave(newProfile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/profiles/edit/%s", newProfile.ID))
}

// PUT /profiles/delete/:id
// POST /profiles/delete/:id
func BagItProfileDelete(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	profile := result.BagItProfile()
	err := core.ObjDelete(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
	}
	data := map[string]string{
		"status":   "OK",
		"location": "/profiles",
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted BagIt Profile %s", result.BagItProfile().Name))
	c.JSON(http.StatusOK, data)
}

// GET /profiles/edit/:id
func BagItProfileEdit(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	profile := request.QueryResult.BagItProfile()
	request.TemplateData["tagFileNames"] = profile.TagFileNames()
	tagMap := make(map[string][]*core.TagDefinition)
	for _, name := range profile.TagFileNames() {
		tagMap[name] = profile.TagsInFile(name)
	}
	request.TemplateData["tagsInFile"] = tagMap
	request.TemplateData["activeTab"] = c.DefaultQuery("tab", "navAboutTab")
	request.TemplateData["activeTagFile"] = c.Query("tagFile")
	c.HTML(http.StatusOK, "bagit_profile/form.html", request.TemplateData)
}

// GET /profiles
func BagItProfileIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.BagItProfiles
	c.HTML(http.StatusOK, "bagit_profile/list.html", request.TemplateData)
}

// GET /profiles/new
func BagItProfileNew(c *gin.Context) {
	form, err := core.NewBagItProfileCreationForm()
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := gin.H{
		"form":    form,
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "bagit_profile/new.html", data)
}

// GET /profiles/import_start
func BagItProfileImportStart(c *gin.Context) {
	form := core.NewBagItProfileImport("", "", nil).ToForm()
	data := gin.H{
		"helpUrl": GetHelpUrl(c),
		"form":    form,
	}
	c.HTML(http.StatusOK, "bagit_profile/import.html", data)
}

// POST /profiles/import
func BagItProfileImport(c *gin.Context) {
	bpi := &core.BagItProfileImport{}
	// c.Bind(bpi) won't convert from string to []byte.
	// In fact, calling Bind() here leads to a 404 with
	// an error about strconv.ParseUint being given invalid syntax.
	// So we bind the old fashioned way.
	bpi.JsonData = []byte(c.PostForm("JsonData"))
	bpi.URL = c.PostForm("URL")
	bpi.ImportSource = c.PostForm("ImportSource")
	convertedProfile, err := bpi.Convert()
	if err != nil {
		form := bpi.ToForm()
		if form.Fields["ImportSource"].Error == "" {
			form.Fields["ImportSource"].Error = "JSON is invalid or does not represent a recognizable BagIt profile structure: " + err.Error()
		}
		data := gin.H{
			"form": form,
		}
		c.HTML(http.StatusBadRequest, "bagit_profile/import.html", data)
		return
	}
	convertedProfile.Name = fmt.Sprintf("%s %s", convertedProfile.Name, time.Now().Format(time.Stamp))
	convertedProfile.IsBuiltIn = false // profile is imported, not built-in
	err = core.ObjSave(convertedProfile)
	if err != nil {
		data := gin.H{
			"form":    bpi.ToForm(),
			"helpUrl": GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "bagit_profile/import.html", data)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/profiles/edit/%s", convertedProfile.ID))
}

// GET /profiles/export/:id
func BagItProfileExport(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	profile := result.BagItProfile()
	profileJson, err := profile.ToStandardFormat().ToJSON()
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, result.Error)
		return
	}
	templateData := gin.H{
		"json": profileJson,
	}
	c.HTML(http.StatusOK, "bagit_profile/export.html", templateData)
}

// PUT /profiles/edit/:id
// POST /profiles/edit/:id
func BagItProfileSave(c *gin.Context) {
	// Load the existing profile here, so we get the existing
	// tag definitions, which will not be on the submitted form.
	profile := &core.BagItProfile{}
	result := core.ObjFind(c.Param("id"))
	if result.BagItProfile() != nil {
		profile = result.BagItProfile()

		// Clear these values out, or else the call
		// to c.Bind() below will merge them with
		// values the user submitted. E.g. If we
		// have 2 ManifestsRequired and user deletes
		// them both, we'll still have 2 required if
		// we don't clear the list now.
		profile.ManifestsAllowed = []string{}
		profile.ManifestsRequired = []string{}
		profile.TagManifestsAllowed = []string{}
		profile.TagManifestsRequired = []string{}
	}

	err := c.Bind(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	// For tag files allowed, split lines into individual file names.
	// This data comes from a textarea, with one file name per line.
	if len(profile.TagFilesAllowed) == 1 {
		rawString := strings.TrimSpace(profile.TagFilesAllowed[0])
		allowed := strings.Split(rawString, "\n")
		for i := range allowed {
			allowed[i] = strings.TrimSpace(allowed[i])
		}
		profile.TagFilesAllowed = allowed
	}
	err = core.ObjSave(profile)
	if err != nil {
		objectExistsInDB, _ := core.ObjExists(profile.ID)
		data := gin.H{
			"form":             profile.ToForm(),
			"objectExistsInDB": objectExistsInDB,
			"errMsg":           "Please correct the following errors",
			"errors":           profile.Errors,
			"helpUrl":          GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "bagit_profile/form.html", data)
		return
	}
	c.Redirect(http.StatusFound, "/profiles")
}

// GET /profiles/new_tag/:profile_id/:tag_file
func BagItProfileNewTag(c *gin.Context) {
	tag := &core.TagDefinition{
		ID:        uuid.NewString(),
		IsBuiltIn: false,
		TagFile:   c.Param("tag_file"),
		TagName:   "New-Tag",
	}
	templateData := gin.H{
		"bagItProfileID": c.Param("profile_id"),
		"tag":            tag,
		"form":           tag.ToForm(),
		"helpUrl":        GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "tag_definition/form.html", templateData)
}

// GET /profiles/edit_tag/:profile_id/:tag_id
func BagItProfileEditTag(c *gin.Context) {
	// This displays in a modal.
	profile, tag, err := loadProfileAndTag(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	templateData := gin.H{
		"bagItProfileID": profile.ID,
		"tag":            tag,
		"form":           tag.ToForm(),
		"helpUrl":        GetHelpUrl(c),
	}

	c.HTML(http.StatusOK, "tag_definition/form.html", templateData)
}

// POST /profiles/edit_tag/:profile_id/:tag_id
// PUT  /profiles/edit_tag/:profile_id/:tag_id
func BagItProfileSaveTag(c *gin.Context) {
	profile, tag, err := loadProfileAndTag(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	if tag == nil {
		tag = &core.TagDefinition{}
	}
	c.Bind(tag)

	// On the HTML form, allowed values are displayed in a textarea,
	// with one item per line. We need to split this into multiple
	// values.
	tag.Values = util.SplitAndTrim(tag.Values[0], "\n")

	if !tag.Validate() {
		templateData := gin.H{
			"bagItProfileID": profile.ID,
			"tag":            tag,
			"form":           tag.ToForm(),
			"helpUrl":        GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "tag_definition/form.html", templateData)
		return
	}

	// If this is an existing tag, replace the old version
	// with the newly edited one. Otherwise, append it to the
	// list of existing tags.
	tagExists := false
	for i, existingTag := range profile.Tags {
		if existingTag.ID == tag.ID {
			profile.Tags[i] = tag
			tagExists = true
			break
		}
	}
	if !tagExists {
		profile.Tags = append(profile.Tags, tag)
	}

	// Validation error here should not be possible, since we just
	// pulled a valid profile from the DB and only altered
	// or added a single tag, which we know by now is valid.
	err = core.ObjSave(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	// Bad practice returning JSON here, when we return HTML above.
	// However, this XHR request is tricky to handle otherwise.
	// On successful save, we want to redirect, not just re-render.

	query := url.Values{}
	query.Set("tab", "navTagFilesTab")
	query.Set("tagFile", tag.TagFile)
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/profiles/edit/%s?%s", profile.ID, query.Encode()),
	}
	c.JSON(http.StatusOK, data)
}

// POST /profiles/delete_tag/:profile_id/:tag_id
// PUT  /profiles/delete_tag/:profile_id/:tag_id
func BagItProfileDeleteTag(c *gin.Context) {
	profile, tag, err := loadProfileAndTag(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	tagIndex := -1
	for i, tagDef := range profile.Tags {
		if tagDef.ID == tag.ID {
			tagIndex = i
			break
		}
	}
	if tagIndex < 0 {
		AbortWithErrorHTML(c, http.StatusBadRequest, fmt.Errorf("Tag was not found in this BagIt profile"))
		return
	}
	profile.Tags = util.RemoveFromSlice[*core.TagDefinition](profile.Tags, tagIndex)
	err = core.ObjSave(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	query := url.Values{}
	query.Set("tab", "navTagFilesTab")
	query.Set("tagFile", tag.TagFile)
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/profiles/edit/%s?%s", profile.ID, query.Encode()),
	}
	c.JSON(http.StatusOK, data)
}

// GET /profiles/new_tag_file/:profile_id
func BagItProfileNewTagFile(c *gin.Context) {
	form, profileID := getTagFileFormAndID(c)
	data := gin.H{
		"form":           form,
		"bagItProfileID": profileID,
		"helpUrl":        GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "bagit_profile/new_tag_file.html", data)
}

// POST /profiles/new_tag_file/:profile_id
func BagItProfileCreateTagFile(c *gin.Context) {
	form, profileID := getTagFileFormAndID(c)
	tagFileName := strings.TrimSpace(c.PostForm("Name"))
	if tagFileName == "" {
		form.Fields["Name"].Error = "Name is required."
		data := gin.H{
			"form":           form,
			"bagItProfileID": profileID,
			"helpUrl":        GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "bagit_profile/new_tag_file.html", data)
		return
	}
	result := core.ObjFind(profileID)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	profile := result.BagItProfile()
	tags, err := profile.FindMatchingTags("TagFile", tagFileName)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	if len(tags) > 0 {
		form.Fields["Name"].Error = "A tag file with this name already exists."
		data := gin.H{
			"form":           form,
			"bagItProfileID": profileID,
			"helpUrl":        GetHelpUrl(c),
		}
		c.HTML(http.StatusBadRequest, "bagit_profile/new_tag_file.html", data)
		return
	}

	newTag := core.TagDefinition{
		ID:              uuid.NewString(),
		TagName:         "New-Tag",
		TagFile:         tagFileName,
		IsUserAddedFile: true,
		IsUserAddedTag:  true,
	}
	profile.Tags = append(profile.Tags, &newTag)
	err = core.ObjSave(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}

	query := url.Values{}
	query.Set("tab", "navTagFilesTab")
	query.Set("tagFile", tagFileName)
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/profiles/edit/%s?%s", profileID, query.Encode()),
	}
	c.JSON(http.StatusOK, data)
}

// POST /profiles/delete_tag_file/:profile_id
// PUT  /profiles/delete_tag_file/:profile_id
func BagItProfileDeleteTagFile(c *gin.Context) {
	tagFileName := c.PostForm("tagFile")
	if tagFileName == "bagit.txt" || tagFileName == "bag-info.txt" {
		AbortWithErrorHTML(c, http.StatusNotFound, fmt.Errorf("bagit.txt and bag-info.txt cannot be deleted"))
		return
	}
	result := core.ObjFind(c.Param("profile_id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	profile := result.BagItProfile()
	newTagList := make([]*core.TagDefinition, 0)
	for _, tag := range profile.Tags {
		if tag.TagFile != tagFileName {
			newTagList = append(newTagList, tag)
		}
	}
	profile.Tags = newTagList
	err := core.ObjSave(profile)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}

	// Show the tab for bag-info.txt, since that one can't be deleted.
	query := url.Values{}
	query.Set("tab", "navTagFilesTab")
	query.Set("tagFile", "bag-info.txt")
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/profiles/edit/%s?%s", profile.ID, query.Encode()),
	}
	c.JSON(http.StatusOK, data)
}

func loadProfileAndTag(c *gin.Context) (*core.BagItProfile, *core.TagDefinition, error) {
	result := core.ObjFind(c.Param("profile_id"))
	if result.Error != nil {
		return nil, nil, result.Error
	}
	profile := result.BagItProfile()
	tag, err := profile.FirstMatchingTag("ID", c.Param("tag_id"))
	return profile, tag, err
}

func getTagFileFormAndID(c *gin.Context) (*core.Form, string) {
	profileID := c.Param("profile_id")
	form := core.NewForm("", "", nil)
	form.AddField("Name", "Tag File Name", "", true)
	return form, profileID
}
