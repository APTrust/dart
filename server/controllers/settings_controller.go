package controllers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// ExportSettingsIndex displays a list of ExportSettings
// objects.
//
// GET /settings/export
func ExportSettingsIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["items"] = request.QueryResult.ExportSettings
	c.HTML(http.StatusOK, "settings/list.html", request.TemplateData)
}

// SettingsExportEdit shows a form on which user can edit
// the specified ExportSettings.
//
// GET /settings/export/edit/:id
func SettingsExportEdit(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	data := gin.H{
		"settings": exportSettings,
		"form":     exportSettings.ToForm(),
		"flash":    GetFlashCookie(c),
		"helpUrl":  GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/export.html", data)
}

// SettingsExportSave saves ExportSettings.
//
// POST /settings/export/save/:id
func SettingsExportSave(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	exportSettings.Name = c.PostForm("Name")

	// Include collections of settings that the user
	// specified on the HTML form.
	// Note that we're not dealing with questions here.
	// We'll deal with those in the questions endpoints.

	err = setExportSettingsCollections(c, exportSettings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}

	err = core.ObjSave(exportSettings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}

	if c.PostForm("showAfterSave") == "true" {
		SettingsExportShowJson(c)
		return
	}

	SetFlashCookie(c, "Settings have been saved.")
	c.Redirect(http.StatusFound, fmt.Sprintf("/settings/export/edit/%s", exportSettings.ID))
}

// SettingsExportNew creates a new ExportSettings object
// and then redirects to the edit form.
//
// GET /settings/export/new
func SettingsExportNew(c *gin.Context) {
	exportSettings := core.NewExportSettings()
	err := core.ObjSave(exportSettings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/settings/export/edit/%s", exportSettings.ID))
}

// SettingsExportDelete deletes the ExportSettings record with the specified ID.
//
// POST /settings/export/delete/:id
func SettingsExportDelete(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	err = core.ObjDelete(exportSettings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted settings %s", exportSettings.Name))
	c.Redirect(http.StatusFound, "/settings/export")
}

// SettingsExportShowJson shows the JSON representation of
// an ExportSettings object. This is the value a user will
// copy to share settings with others.
//
// GET /settings/export/show_json/:id
func SettingsExportShowJson(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	jsonData, err := json.MarshalIndent(exportSettings, "", "  ")
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	displayPasswordWarning := exportSettings.ContainsPlaintextPassword()
	displayTokenWarning := exportSettings.ContainsPlaintextAPIToken()
	displayPlainTextWarning := "none"
	if displayPasswordWarning || displayTokenWarning {
		displayPlainTextWarning = "block"
	}
	data := gin.H{
		"settings":                exportSettings,
		"json":                    string(jsonData),
		"displayPasswordWarning":  displayPasswordWarning,
		"displayTokenWarning":     displayTokenWarning,
		"displayPlaintextWarning": displayPlainTextWarning,
		"helpUrl":                 GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/export_result.html", data)
}

// SettingsExportNewQuestion show a new, empty question form.
// The front end displays this in a modal dialog.
//
// GET /settings/export/questions/new/:id
func SettingsExportNewQuestion(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorJSON(c, http.StatusNotFound, err)
		return
	}
	question := core.NewExportQuestion()

	// We show options related to the export settings only, not all options.
	// Showing all confuses the user because many don't apply to the settings at hand.
	opts := core.NewExportOptionsFromSettings(exportSettings)
	optionsJson, err := json.Marshal(opts)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := gin.H{
		"settings":    exportSettings,
		"question":    question,
		"form":        question.ToForm(),
		"optionsJson": template.JS(string(optionsJson)),
		"helpUrl":     GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/question.html", data)
}

// SettingsExportSaveQuestion saves questions attached
// to the specified ExportSettings object.
//
// POST /settings/export/questions/:id
func SettingsExportSaveQuestion(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("id"))
	if err != nil {
		AbortWithErrorJSON(c, http.StatusNotFound, err)
		return
	}
	question := &core.ExportQuestion{}
	err = c.ShouldBind(question)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusBadRequest, err)
		return
	}
	found := false
	for i := range exportSettings.Questions {
		if exportSettings.Questions[i].ID == question.ID {
			exportSettings.Questions[i] = question
			found = true
			break
		}
	}
	if !found {
		exportSettings.Questions = append(exportSettings.Questions, question)
	}
	err = core.ObjSave(exportSettings)
	if err != nil {
		AbortWithErrorJSON(c, http.StatusInternalServerError, err)
		return
	}

	// Note that we add a random query string value here. This is
	// because the browser will not reload the underlying page if
	// only the query hash has changed. The additional random param
	// forces the browser to reload the underlying page after we
	// save the export question.
	data := map[string]string{
		"status":   "OK",
		"location": fmt.Sprintf("/settings/export/edit/%s?rand=%d#questions", exportSettings.ID, rand.Intn(500000)),
	}
	c.JSON(http.StatusOK, data)

}

// SettingsExportEditQuestion shows a form to edit a question from ExportSettings.
//
// GET /settings/export/questions/edit/:settings_id/:question_id
func SettingsExportEditQuestion(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("settings_id"))
	if err != nil {
		AbortWithErrorJSON(c, http.StatusNotFound, err)
		return
	}
	var question *core.ExportQuestion
	for _, q := range exportSettings.Questions {
		if q.ID == c.Param("question_id") {
			question = q
			break
		}
	}
	opts := core.NewExportOptionsFromSettings(exportSettings)
	optionsJson, err := json.Marshal(opts)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	data := gin.H{
		"settings":    exportSettings,
		"question":    question,
		"form":        question.ToForm(),
		"optionsJson": template.JS(string(optionsJson)),
		"helpUrl":     GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/question.html", data)
}

// SettingsExportDeleteQuestion deletes a question from ExportSettings.
//
// POST /settings/export/questions/delete/:settings_id/:question_id
func SettingsExportDeleteQuestion(c *gin.Context) {
	exportSettings, err := getExportSettings(c.Param("settings_id"))
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	questions := make([]*core.ExportQuestion, 0)
	for _, question := range exportSettings.Questions {
		if question.ID != c.Param("question_id") {
			questions = append(questions, question)
		}
	}
	exportSettings.Questions = questions
	err = core.ObjSave(exportSettings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	redirectUrl := fmt.Sprintf("/settings/export/edit/%s", c.Param("settings_id"))
	c.Redirect(http.StatusFound, redirectUrl)
}

// SettingsImportShow shows a form on which user can specify a URL
// from which to import settings, or a blob of JSON to be imported
// directly.
//
// GET /settings/import
func SettingsImportShow(c *gin.Context) {
	data := gin.H{
		"helpUrl": GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "settings/import.html", data)
}

// SettingsImportRun actually runs the import, saving whatever
// export settings are submitted in the form or fetched from the URL.
//
// If the settings include questions, the user will have to
// answer those before we actually do the import.
//
// POST /settings/import
func SettingsImportRun(c *gin.Context) {
	importSource := c.PostForm("importSource")
	if importSource == "url" {
		settingsImportFromUrl(c)
	} else {
		settingsImportFromJson(c)
	}
}

// settingsImportFromUrl imports settings from a URL.
func settingsImportFromUrl(c *gin.Context) {
	jsonUrl := c.PostForm("txtUrl")
	response, err := http.Get(jsonUrl)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	jsonBytes, err := io.ReadAll(response.Body)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	processImport(c, jsonBytes)
}

// settingsImportFromJson imports JSON from a blob that the
// user pasted into a textarea on the settings/import page.
func settingsImportFromJson(c *gin.Context) {
	jsonStr := c.PostForm("txtJson")
	processImport(c, []byte(jsonStr))
}

func processImport(c *gin.Context, jsonBytes []byte) {
	settings := &core.ExportSettings{}
	err := json.Unmarshal(jsonBytes, settings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	if len(settings.Questions) > 0 {
		showImportQuestions(c, settings)
	} else {
		importSettings(c, settings)
	}
}

// Display the import questions so the user can answer them.
func showImportQuestions(c *gin.Context, settings *core.ExportSettings) {
	settingsJson, err := json.Marshal(settings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
	}
	data := gin.H{
		"settings":     settings,
		"settingsJson": string(settingsJson),
	}
	c.HTML(http.StatusOK, "settings/import_questions.html", data)
}

func importSettings(c *gin.Context, settings *core.ExportSettings) {
	// Save all app settings, bagit profiles, remote repos and storage services
	// For each successful import, show green check next to type and name.
	// For each failure, show red X beside type and name, and error message underneath.
	type ImportResult struct {
		Name      string
		Succeeded bool
		Error     string
	}
	hasError := false
	appSettingResults := make([]ImportResult, 0)
	for _, appSetting := range settings.AppSettings {
		result := ImportResult{Name: appSetting.Name, Succeeded: true}
		err := core.ObjSave(appSetting)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
		}
		appSettingResults = append(appSettingResults, result)
	}

	profileResults := make([]ImportResult, 0)
	for _, profile := range settings.BagItProfiles {
		result := ImportResult{Name: profile.Name, Succeeded: true}
		err := core.ObjSave(profile)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
		}
		profileResults = append(profileResults, result)
	}

	repoResults := make([]ImportResult, 0)
	for _, repo := range settings.RemoteRepositories {
		result := ImportResult{Name: repo.Name, Succeeded: true}
		err := core.ObjSave(repo)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
		}
		repoResults = append(repoResults, result)
	}

	ssResults := make([]ImportResult, 0)
	for _, ss := range settings.StorageServices {
		result := ImportResult{Name: ss.Name, Succeeded: true}
		err := core.ObjSave(ss)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
		}
		ssResults = append(ssResults, result)
	}

	status := http.StatusOK
	if hasError {
		status = http.StatusBadRequest
	}
	data := gin.H{
		"appSettingResults": appSettingResults,
		"profileResults":    profileResults,
		"repoResults":       repoResults,
		"ssResults":         ssResults,
		"helpUrl":           GetHelpUrl(c),
	}
	c.HTML(status, "settings/import_result.html", data)
}

// SettingsImportAnswers receives the user's answers to
// settings questions and applies them to the proper objects
// and fields before saving the settings.
//
// POST /settings/import/answers
func SettingsImportAnswers(c *gin.Context) {
	settingsJson := c.PostForm("settingsJson")
	settings := &core.ExportSettings{}
	err := json.Unmarshal([]byte(settingsJson), settings)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusBadRequest, err)
		return
	}
	// Copy answers to the right settings.
	for _, question := range settings.Questions {
		response := c.PostForm(question.ID)
		switch question.ObjType {
		case constants.TypeAppSetting:
			err = setAppSettingValue(settings, question, response)
		case constants.TypeBagItProfile:
			err = setBagItProfileValue(settings, question, response)
		case constants.TypeRemoteRepository:
			err = setRemoteRepoValue(settings, question, response)
		case constants.TypeStorageService:
			err = setStorageServiceValue(settings, question, response)
		}
		if err != nil {
			AbortWithErrorHTML(c, http.StatusInternalServerError, err)
			return
		}
	}

	// At this point, we should have copied user answers
	// to the right settings / profile tags, and now we
	// can save the settings locally.
	importSettings(c, settings)
}

func setAppSettingValue(settings *core.ExportSettings, question *core.ExportQuestion, value string) error {
	err := constants.ErrNoSuchField
	for i := range settings.AppSettings {
		setting := settings.AppSettings[i]
		if setting.ID == question.ObjID {
			// All fields on AppSetting type are string
			err = util.SetStringValue(setting, question.Field, value)
		}
	}
	return err
}

func setBagItProfileValue(settings *core.ExportSettings, question *core.ExportQuestion, value string) error {
	err := constants.ErrNoSuchField
	for _, profile := range settings.BagItProfiles {
		for i := range profile.Tags {
			tag := profile.Tags[i]
			// Unlike other settings, where question.Field
			// refers to the field name of a struct, for
			// BagIt profiles, question.Field refers to the
			// UUID of a tag.
			if tag.ID == question.Field {
				// Tag values are always strings
				tag.DefaultValue = value
				err = nil
			}
		}
	}
	return err
}

func setRemoteRepoValue(settings *core.ExportSettings, question *core.ExportQuestion, value string) error {
	err := constants.ErrNoSuchField
	for i := range settings.RemoteRepositories {
		repo := settings.RemoteRepositories[i]
		if repo.ID == question.ObjID {
			// All fields on RemoteRepository type are string
			err = util.SetStringValue(repo, question.Field, value)
		}
	}
	return err
}

func setStorageServiceValue(settings *core.ExportSettings, question *core.ExportQuestion, value string) error {
	err := constants.ErrNoSuchField
	for i := range settings.StorageServices {
		ss := settings.StorageServices[i]
		if ss.ID == question.ObjID {
			if question.Field == "AllowsUpload" || question.Field == "AllowsDownload" {
				boolValue, conversionError := util.StringToBool(value)
				if conversionError != nil {
					err = conversionError
				} else {
					err = util.SetBoolValue(ss, question.Field, boolValue)
				}
			} else if question.Field == "Port" {
				intValue, conversionError := strconv.Atoi(value)
				if conversionError != nil {
					err = conversionError
				} else {
					err = util.SetIntValue(ss, question.Field, int64(intValue))
				}
			} else {
				// All other types on this object are string
				err = util.SetStringValue(ss, question.Field, value)
			}
		}
	}
	return err
}

// // TODO: Delete this? I'm not sure it's used anymore.
// //
// // GET /settings/profile_tags
// func SettingsProfileTagList(c *gin.Context) {
// 	profileID := c.Query("profileID")
// 	list, err := core.UserSettableTagsForProfile(profileID)
// 	if err != nil {
// 		AbortWithErrorJSON(c, http.StatusNotFound, err)
// 		return
// 	}
// 	c.JSON(http.StatusOK, list)
// }

// setExportSettingsCollections sets AppSettings, BagItProfiles,
// RemoteRepositories, and StorageServices on the exportSettings
// object based on values the user submitted in the HTML form.
func setExportSettingsCollections(c *gin.Context, exportSettings *core.ExportSettings) error {

	exportSettings.AppSettings = make([]*core.AppSetting, 0)
	for _, uuid := range c.PostFormArray("AppSettings") {
		result := core.ObjFind(uuid)
		if result.Error != nil {
			return result.Error
		}
		exportSettings.AppSettings = append(exportSettings.AppSettings, result.AppSetting())
	}

	exportSettings.BagItProfiles = make([]*core.BagItProfile, 0)
	for _, uuid := range c.PostFormArray("BagItProfiles") {
		result := core.ObjFind(uuid)
		if result.Error != nil {
			return result.Error
		}
		exportSettings.BagItProfiles = append(exportSettings.BagItProfiles, result.BagItProfile())
	}

	exportSettings.RemoteRepositories = make([]*core.RemoteRepository, 0)
	for _, uuid := range c.PostFormArray("RemoteRepositories") {
		result := core.ObjFind(uuid)
		if result.Error != nil {
			return result.Error
		}
		exportSettings.RemoteRepositories = append(exportSettings.RemoteRepositories, result.RemoteRepository())
	}

	exportSettings.StorageServices = make([]*core.StorageService, 0)
	for _, uuid := range c.PostFormArray("StorageServices") {
		result := core.ObjFind(uuid)
		if result.Error != nil {
			return result.Error
		}
		exportSettings.StorageServices = append(exportSettings.StorageServices, result.StorageService())
	}

	return nil
}

func getExportSettings(id string) (*core.ExportSettings, error) {
	result := core.ObjFind(id)
	if result.Error != nil {
		return nil, result.Error
	}
	return result.ExportSetting(), nil
}
