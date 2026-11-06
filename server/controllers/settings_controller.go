package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"math/rand"
	"net/http"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
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
		importSettings(c, settings, nil)
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

// answerFailureReason returns a short explanation of why the answer
// to an import question could not be applied. The import result page
// already shows the question's prompt, so unlike the error from
// SetValueFromResponse, the reason doesn't repeat it.
//
// This depends on how SetValueFromResponse builds its errors: when the
// answer can't be stored in the field, it wraps the field's error after
// the prompt, and when it can't find what the question points to, it
// returns a sentinel error with the prompt in the message.
func answerFailureReason(question *core.ExportQuestion, err error) string {
	inner := errors.Unwrap(err)
	if inner != nil && inner != constants.ErrUnknownType && inner != constants.ErrNoSuchField && inner != constants.ErrInvalidOperation {
		// The field rejected the value. Drop the low-level cause,
		// such as a strconv parse error, and keep the part that
		// says what the field needs.
		reason := inner.Error()
		if cause := errors.Unwrap(inner); cause != nil {
			reason = strings.TrimSuffix(reason, ": "+cause.Error())
		}
		return reason
	}
	switch {
	case errors.Is(err, constants.ErrUnknownType):
		return fmt.Sprintf("DART doesn't recognize the setting type %q.", question.ObjType)
	case errors.Is(err, constants.ErrNoSuchField) && question.ObjType == constants.TypeBagItProfile:
		return "The BagIt profile tag this answer belongs to isn't in the import file."
	case errors.Is(err, constants.ErrNoSuchField):
		return "The setting this answer belongs to isn't in the import file."
	}
	return err.Error()
}

// ImportResult describes the outcome of importing one setting,
// or of applying one answer to an import question. The import
// result page shows a green check for each success and a red X
// with the error message for each failure.
type ImportResult struct {
	Name      string
	Succeeded bool
	Error     string
}

// importSettings saves all app settings, BagIt profiles, remote
// repositories and storage services, then shows the user which
// ones were imported and which failed. answerResults describes
// which of the user's answers to import questions were applied;
// it's nil when the settings had no questions.
func importSettings(c *gin.Context, settings *core.ExportSettings, answerResults []ImportResult) {
	hasError := false
	for _, result := range answerResults {
		if !result.Succeeded {
			hasError = true
		}
	}
	appSettingResults := make([]ImportResult, 0)
	for _, appSetting := range settings.AppSettings {
		// On import, UserCanDelete defaults to false if
		// it's not set in the JSON, and it's not if the export
		// came from DART 2. This is annoying, because the setting
		// will stick around forever, even if the user doesn't want it.
		// Let users delete non-essential app settings.
		if appSetting.Name != "Bagging Directory" && appSetting.Name != "Control Characters in File Names" {
			appSetting.UserCanDelete = true
		}
		result := ImportResult{Name: appSetting.Name, Succeeded: true}
		err := core.ObjSave(appSetting)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
			core.Dart.Log.Errorf("Error importing AppSetting %s: %v", appSetting.Name, err)
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
			name := ""
			if profile != nil {
				name = profile.Name
			}
			core.Dart.Log.Errorf("Error importing BagIt profile %s: %v", name, err)
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
			name := ""
			if repo != nil {
				name = repo.Name
			}
			core.Dart.Log.Errorf("Error importing RemoteRepository %s: %v", name, err)
		}
		repoResults = append(repoResults, result)
	}

	ssResults := make([]ImportResult, 0)
	for _, ss := range settings.StorageServices {
		result := ImportResult{Name: ss.Name, Succeeded: true}

		// If StorageService includes hard-coded login and password,
		// DART 2 will not export these credantials for security reasons.
		// Those missing attributes will cause a validation failure.
		// We want users to be able to import the storage service anyway,
		// and they can fill in user/password credentials later.
		// For this reason, we save StorageService without validation.
		err := core.ObjSaveWithoutValidation(ss)
		if err != nil {
			hasError = true
			result.Error = err.Error()
			result.Succeeded = false
			name := ""
			if ss != nil {
				name = ss.Name
			}

			core.Dart.Log.Errorf("Error importing StorageService %s: %v", name, err)
		}
		ssResults = append(ssResults, result)
	}

	status := http.StatusOK
	if hasError {
		status = http.StatusBadRequest
	}
	data := gin.H{
		"answerResults":     answerResults,
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
	// Copy answers to the right settings. If an answer can't be
	// applied (unknown object type, missing object or tag, or a
	// value that doesn't fit the field), record the failure and
	// keep going, so we import everything we can. The affected
	// setting keeps the value it had in the import file.
	answerResults := make([]ImportResult, 0, len(settings.Questions))
	for _, question := range settings.Questions {
		if question == nil {
			continue
		}
		result := ImportResult{Name: question.Prompt, Succeeded: true}
		response := c.PostForm(question.ID)
		if err := settings.SetValueFromResponse(question, response); err != nil {
			result.Succeeded = false
			result.Error = answerFailureReason(question, err)
			core.Dart.Log.Warningf("Skipping answer to import question %q: %v", question.Prompt, err)
		}
		answerResults = append(answerResults, result)
	}

	// Save the settings locally, including whatever answers
	// we were able to apply.
	importSettings(c, settings, answerResults)
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
