package controllers_test

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// This loads settings fixtures into the database and returns
// a slice of the two settings objects. Note that settings without
// questions is the first item in the list, and settings with
// questions is the second item, as in the consts above.
func loadExportSettings(t *testing.T) []*core.ExportSettings {
	settingsList := make([]*core.ExportSettings, 2)
	fixtures := []string{
		"export_settings_no_questions.json",
		"export_settings_with_questions.json",
	}
	for i, fixture := range fixtures {
		file := filepath.Join(util.ProjectRoot(), "testdata", "files", fixture)
		data, err := util.ReadFile(file)
		require.Nil(t, err)
		settings := &core.ExportSettings{}
		err = json.Unmarshal(data, settings)
		require.Nil(t, err)
		err = core.ObjSave(settings)
		require.Nil(t, err, settings.Name)
		settingsList[i] = settings

		// We need to save the object attached to these
		// settings so they'll appear as options on the
		// settings export page.
		for _, appSetting := range settings.AppSettings {
			require.NoError(t, core.ObjSave(appSetting))
		}
		for _, profile := range settings.BagItProfiles {
			require.NoError(t, core.ObjSave(profile))
		}
		for _, repo := range settings.RemoteRepositories {
			require.NoError(t, core.ObjSave(repo))
		}
		for _, ss := range settings.StorageServices {
			require.NoError(t, core.ObjSave(ss))
		}
	}
	return settingsList
}

func loadObjectsForExportTests(t *testing.T) {
	_, err := core.CreateAppSettings(2)
	require.NoError(t, err)

	_, err = core.CreateBagItProfiles(2)
	require.NoError(t, err)

	_, err = core.CreateRemoteRepos(2)
	require.NoError(t, err)

	_, err = core.CreateStorageServices(2)
	require.NoError(t, err)
}

func setUpExportTest(t *testing.T) []*core.ExportSettings {
	loadObjectsForExportTests(t)
	return loadExportSettings(t)
}

func TestSettingsExportIndex(t *testing.T) {
	defer core.ClearDartTable()
	settings := setUpExportTest(t)
	expected := []string{
		settings[0].ID,
		settings[0].Name,
		settings[1].ID,
		settings[1].Name,
	}
	DoSimpleGetTest(t, "/settings/export", expected)
}

func TestSettingsExportEdit(t *testing.T) {
	defer core.ClearDartTable()
	settings := loadExportSettings(t)

	expected := []string{
		settings[0].ID,
		settings[0].Name,
	}

	// This page should display all available objects of the following
	// types as checkboxes.
	types := []string{
		constants.TypeAppSetting,
		constants.TypeBagItProfile,
		constants.TypeRemoteRepository,
		constants.TypeStorageService,
	}
	for _, objType := range types {
		checkboxName := fmt.Sprintf("%ss", objType)
		if objType == constants.TypeRemoteRepository {
			checkboxName = "RemoteRepositories"
		}
		for _, item := range core.ObjNameIdList(objType) {
			html := fmt.Sprintf(`type="checkbox" name="%s" value="%s"`, checkboxName, item.ID)
			expected = append(expected, html)
			expected = append(expected, item.Name)
		}
	}
	pageUrl := fmt.Sprintf("/settings/export/edit/%s", settings[0].ID)
	DoSimpleGetTest(t, pageUrl, expected)
}

func TestSettingsExportNewSaveDelete(t *testing.T) {
	defer core.ClearDartTable()
	loadExportSettings(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/settings/export/new", nil)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusFound, w.Code)
	redirectUrl := w.Result().Header["Location"][0]
	newSettingsID := strings.Replace(redirectUrl, "/settings/export/edit/", "", 1)
	assert.True(t, util.LooksLikeUUID(newSettingsID))
	result := core.ObjFind(newSettingsID)
	require.Nil(t, result.Error)
	newSettings := result.ExportSetting()

	testSettingsExportSave(t, newSettings)
	testSettingsExportDelete(t, newSettingsID)
}

func testSettingsExportSave(t *testing.T, settings *core.ExportSettings) {
	types := []string{
		constants.TypeAppSetting,
		constants.TypeBagItProfile,
		constants.TypeRemoteRepository,
		constants.TypeStorageService,
	}
	params := url.Values{}
	params.Add("id", settings.ID)
	params.Add("Name", settings.Name+" Edited")
	// Add two AppSettings, two BagItProfiles, two remote repos
	// and two storage services to these export settings.
	for _, objType := range types {
		paramName := fmt.Sprintf("%ss", objType)
		if objType == constants.TypeRemoteRepository {
			paramName = "RemoteRepositories"
		}
		for i, item := range core.ObjNameIdList(objType) {
			params.Add(paramName, item.ID)
			if i == 1 {
				break
			}
		}
	}
	postTestSettings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/settings/export/save/%s", settings.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/settings/export/edit/%s", settings.ID),
	}

	// This does the POST and tests the expectations.
	PostUrl(t, postTestSettings)

	// Reload to make sure settings really were saved.
	result := core.ObjFind(settings.ID)
	require.Nil(t, result.Error)
	reloadedSettings := result.ExportSetting()

	// Reloaded settings should have our name change
	assert.Equal(t, (settings.Name + " Edited"), reloadedSettings.Name)

	// And while original settings had no attached objects,
	// our reloaded settings should have two of each.
	assert.Equal(t, 0, len(settings.AppSettings))
	assert.Equal(t, 2, len(reloadedSettings.AppSettings))

	assert.Equal(t, 0, len(settings.BagItProfiles))
	assert.Equal(t, 2, len(reloadedSettings.BagItProfiles))

	assert.Equal(t, 0, len(settings.RemoteRepositories))
	assert.Equal(t, 2, len(reloadedSettings.RemoteRepositories))

	assert.Equal(t, 0, len(settings.StorageServices))
	assert.Equal(t, 2, len(reloadedSettings.StorageServices))
}

func testSettingsExportDelete(t *testing.T, settingsID string) {
	postTestSettings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/settings/export/delete/%s", settingsID),
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/settings/export",
	}
	// This does the POST and tests the expectations.
	PostUrl(t, postTestSettings)

	// Now make sure the item was actually deleted from the DB.
	result := core.ObjFind(settingsID)
	assert.Equal(t, sql.ErrNoRows, result.Error)
}

func TestSettingsExportShowJson(t *testing.T) {
	defer core.ClearDartTable()
	settings := loadExportSettings(t)
	expected := []string{
		settings[1].ID,
	}
	for _, appSetting := range settings[1].AppSettings {
		expected = append(expected, appSetting.ID)
	}
	for _, profile := range settings[1].BagItProfiles {
		expected = append(expected, profile.ID)
	}
	for _, q := range settings[1].Questions {
		expected = append(expected, q.ID)
	}
	for _, repo := range settings[1].RemoteRepositories {
		expected = append(expected, repo.ID)
	}
	for _, ss := range settings[1].StorageServices {
		expected = append(expected, ss.ID)
	}
	pageUrl := fmt.Sprintf("/settings/export/show_json/%s", settings[1].ID)
	DoSimpleGetTest(t, pageUrl, expected)
}

func TestSettingsExportNewQuestion(t *testing.T) {
	defer core.ClearDartTable()
	settings := loadExportSettings(t)

	expected := []string{
		// Form control labels
		"Prompt",
		"Setting Type",
		"Setting Name",
		"Field",
		// Select list options
		"AppSetting",
		"BagItProfile",
		"RemoteRepository",
		"StorageService",
		// JSON data in modal javascript
		"appSettings",
		"bagItProfiles",
		"remoteRepositories",
		"storageServices",
		// Misc field names in JSON
		"APIToken",
		"UserID",
		"LoginExtra",
		"Name",
		"Protocol",
		"Port",
	}
	pageUrl := fmt.Sprintf("/settings/export/questions/new/%s", settings[0].ID)
	DoSimpleGetTest(t, pageUrl, expected)
}

func TestSettingsExportSaveQuestion(t *testing.T) {
	defer core.ClearDartTable()
	settings := loadExportSettings(t)

	// Note that these settings have no questions
	// at the beginning of the test.
	require.Empty(t, settings[0].Questions)

	expected := []string{
		"status",
		"OK",
		"location",
		fmt.Sprintf("/settings/export/edit/%s", settings[0].ID),
	}

	appSettingIds := core.ObjNameIdList(constants.TypeAppSetting)

	question := &core.ExportQuestion{
		ID:      uuid.NewString(),
		Prompt:  "How much wood would a woodchuck chuck if a woodchuck would chuck wood?",
		ObjType: "AppSetting",
		ObjID:   appSettingIds[1].ID,
		Field:   "Value",
	}
	params := url.Values{}
	params.Set("ID", question.ID)
	params.Set("Prompt", question.Prompt)
	params.Set("ObjType", question.ObjType)
	params.Set("ObjID", question.ObjID)
	params.Set("Field", question.Field)

	postTestSettings := PostTestSettings{
		EndpointUrl:          fmt.Sprintf("/settings/export/questions/%s", settings[0].ID),
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent:      expected,
	}
	PostUrl(t, postTestSettings)

	// Make sure the question was saved.
	result := core.ObjFind(settings[0].ID)
	require.Nil(t, result.Error)
	reloadedSettings := result.ExportSetting()
	require.NotEmpty(t, reloadedSettings.Questions)
	assert.Equal(t, question.ID, reloadedSettings.Questions[0].ID)
	assert.Equal(t, question.Prompt, reloadedSettings.Questions[0].Prompt)
	assert.Equal(t, question.ObjType, reloadedSettings.Questions[0].ObjType)
	assert.Equal(t, question.ObjID, reloadedSettings.Questions[0].ObjID)
	assert.Equal(t, question.Field, reloadedSettings.Questions[0].Field)

	testSettingsExportEditQuestion(t, reloadedSettings, question)
	testSettingsExportDeleteQuestion(t, reloadedSettings, question)
}

func testSettingsExportEditQuestion(t *testing.T, settings *core.ExportSettings, question *core.ExportQuestion) {
	expected := []string{
		question.ID,
		question.Prompt,
		question.ObjType,
		question.ObjID,
		question.Field,
	}
	endpointUrl := fmt.Sprintf("/settings/export/questions/edit/%s/%s", settings.ID, question.ID)
	DoSimpleGetTest(t, endpointUrl, expected)
}

func testSettingsExportDeleteQuestion(t *testing.T, settings *core.ExportSettings, question *core.ExportQuestion) {
	endpointUrl := fmt.Sprintf("/settings/export/questions/delete/%s/%s", settings.ID, question.ID)
	redirectUrl := fmt.Sprintf("/settings/export/edit/%s", settings.ID)

	postTestSettings := PostTestSettings{
		EndpointUrl:              endpointUrl,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: redirectUrl,
	}
	PostUrl(t, postTestSettings)

	// Make sure the question was actually deleted
	result := core.ObjFind(settings.ID)
	require.Nil(t, result.Error)
	reloadedSettings := result.ExportSetting()
	assert.Empty(t, reloadedSettings.Questions)
}

func TestSettingsImportShow(t *testing.T) {
	expected := []string{
		"importSourceUrl",
		"importSourceTextArea",
		"txtUrl",
		"txtJson",
		"script",
	}
	DoSimpleGetTest(t, "/settings/import", expected)
}

func TestSettingsImportRunWithJson(t *testing.T) {
	defer core.ClearDartTable()

	// Don't preload data here, or we'll get a conflict
	// when we do the import.

	file := filepath.Join(util.ProjectRoot(), "testdata", "files", "export_settings_no_questions.json")
	data, err := util.ReadFile(file)
	require.Nil(t, err)
	settingsWithoutQuestions := string(data)

	file = filepath.Join(util.ProjectRoot(), "testdata", "files", "export_settings_with_questions.json")
	data, err = util.ReadFile(file)
	require.Nil(t, err)
	settingsWithQuestions := string(data)

	params := url.Values{}
	params.Set("importSource", "textarea")
	params.Set("txtJson", settingsWithQuestions)
	testImportSettingsWithQuestions(t, params)

	params.Set("txtJson", settingsWithoutQuestions)
	testImportSettingsWithoutQuestions(t, params)
}

func TestSettingsImportRunWithUrl(t *testing.T) {
	// Don't preload data here, or we'll get a conflict
	// when we do the import. But do clear out any
	// data we happen to import.
	defer core.ClearDartTable()

	// Also, note that the URLs below will likely have to
	// change once we merge the server branch into master.
	params := url.Values{}
	params.Set("importSource", "url")
	params.Set("txtUrl", "https://raw.githubusercontent.com/APTrust/dart-runner/master/testdata/files/export_settings_with_questions.json")
	testImportSettingsWithQuestions(t, params)

	// Now try importing the settings that have no
	// questions. In this case, we should go right
	// to the import result page.
	params.Set("txtUrl", "https://raw.githubusercontent.com/APTrust/dart-runner/master/testdata/files/export_settings_no_questions.json")
	testImportSettingsWithoutQuestions(t, params)
}

func testImportSettingsWithoutQuestions(t *testing.T, params url.Values) {
	expected := []string{
		"fa-check text-success",
		"Test Setting (Imported - No Questions)",
		"APTrust - Wasabi VA (Imported - No Questions)",
		"Yale University Disk Image (Imported - No Questions)",
		"Sample Repo (Imported - No Questions)",
		"Local Minio (Imported - No Questions)",
		"Local SFTP (Imported - No Questions)",
	}

	postTestSettings := PostTestSettings{
		EndpointUrl:          "/settings/import",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent:      expected,
	}
	DoSimplePostTest(t, postTestSettings)

	// Make sure the new records are in the DB
	assert.Equal(t, 1, len(core.ObjNameIdList(constants.TypeAppSetting)))
	assert.Equal(t, 2, len(core.ObjNameIdList(constants.TypeBagItProfile)))
	assert.Equal(t, 1, len(core.ObjNameIdList(constants.TypeRemoteRepository)))
	assert.Equal(t, 2, len(core.ObjNameIdList(constants.TypeStorageService)))
}

func testImportSettingsWithQuestions(t *testing.T, params url.Values) {
	// These are the question prompts for the export settings
	// at the above URL. We should see these on the page.
	questionPrompts := []string{
		"What is your login name for the local Minio service?",
		"Which port should we connect to for the local Minio service? Enter a positive whole number.",
		"Does the local SFTP service allow downloads?",
		"Enter a value for the test setting. Pick any word you like.",
		"Choose a default access option for APTrust bags: Restricted, Institution, or Consortia.",
		"Enter the default contact name for the Yale BagIt profile.",
		"Enter the user id for the sample repo.",
	}

	// Settings in the URL above include questions,
	// so we should be redirected to the "answer questions" page.
	postTestSettings := PostTestSettings{
		EndpointUrl:          "/settings/import",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent:      questionPrompts,
	}
	DoSimplePostTest(t, postTestSettings)

}

func TestSettingsImportAnswers(t *testing.T) {
	defer core.ClearDartTable()
	settings := loadExportSettings(t)

	// Make a copy of the settings that includes questions.
	newSettings := settings[1]
	newSettings.ID = uuid.NewString()

	// Add the settings JSON to the form.
	settingsJson, err := json.Marshal(newSettings)
	require.Nil(t, err)
	params := url.Values{}
	params.Set("settingsJson", string(settingsJson))

	// Now answer all the questions. Note that on the
	// form, the name of each text entry is the question ID.
	params.Set(newSettings.Questions[0].ID, "My Minio Service")
	params.Set(newSettings.Questions[1].ID, "3333")
	params.Set(newSettings.Questions[2].ID, "yes")
	params.Set(newSettings.Questions[3].ID, "Naugahyde")
	params.Set(newSettings.Questions[4].ID, "Restricted")
	params.Set(newSettings.Questions[5].ID, "Joe Contact")
	params.Set(newSettings.Questions[6].ID, "user@example.com")

	expected := []string{
		"fa-check text-success",
		"Test Setting (Imported)",
		"APTrust - Wasabi VA (Imported)",
		"Yale University Disk Image (Imported)",
		"Sample Repo (Imported)",
		"Local Minio (Imported)",
		"Local SFTP (Imported)",
	}

	// Note that if any portion of the import fails,
	// we'll get http.StatusBadRequest instead of StatusOK.
	postTestSettings := PostTestSettings{
		EndpointUrl:          "/settings/import/answers",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent:      expected,
	}
	DoSimplePostTest(t, postTestSettings)
}
