package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

type DashboardReport struct {
	RepositoryID      string `json:"repositoryId"`
	RepositoryName    string `json:"repositoryName"`
	ReportName        string `json:"reportName"`
	ReportDescription string `json:"reportDescription"`
}

// DashboardShow shows the DART dashboard. This is essentially
// DART's homepage.
//
// GET /
func DashboardShow(c *gin.Context) {
	// Loop through remote repos. For any repo we can reach,
	// pull back all usable reports. A report will simply
	// return a blob of HTML to display.
	result := core.ObjList(constants.TypeJob, "updated_at desc", 20, 0)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, result.Error)
		return
	}

	var reportListJson []byte
	reports, err := getAvailableReports()
	if len(reports) > 0 {
		reportListJson, err = json.Marshal(reports)
	}

	data := gin.H{
		"jobs":           result.Jobs,
		"reportListJson": string(reportListJson),
		"reportsErr":     err,
		"helpUrl":        GetHelpUrl(c),
	}

	c.HTML(http.StatusOK, "dashboard/show.html", data)
}

// DashboardGetReport returns a report from a remote repository.
// This is an AJAX call. We want the dashboard page to display
// first, and then we'll load and display these reports as they
// become available.
//
// Params are RemoteRepoID and ReportName.
//
// GET /dashboard/report
func DashboardGetReport(c *gin.Context) {
	reportName := c.Query("ReportName")
	remoteRepoID := c.Query("RemoteRepoID")
	html, err := getRepoReport(remoteRepoID, reportName)
	result := "ok"
	status := http.StatusOK
	errMsg := ""
	if err != nil {
		result = "error"
		status = http.StatusBadRequest
		errMsg = err.Error()
	}
	data := gin.H{
		"result": result,
		"error":  errMsg,
		"html":   html,
	}
	c.JSON(status, data)
}

func getAvailableReports() ([]DashboardReport, error) {
	reports := make([]DashboardReport, 0)
	result := core.ObjList(constants.TypeRemoteRepository, "obj_name", 100, 0)
	if result.Error != nil {
		return reports, result.Error
	}
	for _, repo := range result.RemoteRepositories {
		if util.LooksLikeUUID(repo.PluginID) {
			available, err := repo.ReportsAvailable()
			if err != nil {
				core.Dart.Log.Errorf("Error getting report list for repo %s (%s): %v", repo.Name, repo.ID, err)
				continue
			}
			for _, report := range available {
				report := DashboardReport{
					RepositoryID:      repo.ID,
					RepositoryName:    repo.Name,
					ReportName:        report.Name,
					ReportDescription: report.Value,
				}
				reports = append(reports, report)
			}
		}
	}
	return reports, nil
}

func getRepoReport(remoteRepoID, reportName string) (string, error) {
	result := core.ObjFind(remoteRepoID)
	if result.Error != nil {
		return "", result.Error
	}
	repo := result.RemoteRepository()
	if repo == nil {
		message := "Remote repository configuration is missing."
		return message, fmt.Errorf(message)
	}
	if repo.UserID == "" || repo.APIToken == "" {
		message := "User name or API key is missing from remote repository configuration."
		return message, fmt.Errorf(message)
	}
	client, err := core.GetRemoteRepoClient(repo)
	if err != nil {
		return "", err
	}
	return client.RunHTMLReport(reportName)
}
