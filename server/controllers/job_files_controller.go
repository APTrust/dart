package controllers

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart-runner/util"
	"github.com/gin-gonic/gin"
)

// GET /jobs/files/:id
func JobShowFiles(c *gin.Context) {
	templateData, err := InitFileChooser(c)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	directory := c.Query("directory")
	job, items, err := GetJobAndDirList(c.Param("id"), directory)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	templateData["job"] = job
	templateData["items"] = items
	templateData["showJobFiles"] = job.PackageOp != nil && len(job.PackageOp.SourceFiles) > 0
	if job.PackageOp != nil {
		templateData["sourceFiles"] = job.PackageOp.SourceFiles
	}

	templateData["dragDropInstructions"] = "Drag and drop the items from the left that you want to package."
	templateData["fileDeletionUrl"] = fmt.Sprintf("/jobs/delete_file/%s", job.ID)
	templateData["jobDeletionUrl"] = fmt.Sprintf("/jobs/delete/%s", job.ID)
	templateData["nextButtonUrl"] = fmt.Sprintf("/jobs/packaging/%s", job.ID)
	templateData["addFileUrl"] = fmt.Sprintf("/jobs/add_file/%s", job.ID)
	templateData["helpUrl"] = GetHelpUrl(c)

	if job.WorkflowID != "" {
		result := core.ObjFind(job.WorkflowID)
		if result.Error != nil {
			core.Dart.Log.Warningf("While running workflow job, JobFilesController could not find workflow with id %s", job.WorkflowID)
		} else {
			templateData["workflow"] = result.Workflow()
		}
	}

	c.HTML(http.StatusOK, "job/files.html", templateData)
}

// POST /jobs/add_file/:id
func JobAddFile(c *gin.Context) {
	fileToAdd := c.PostForm("fullPath")
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	index := -1
	for i, filename := range job.PackageOp.SourceFiles {
		if fileToAdd == filename {
			index = i
			break
		}
	}
	if index < 0 {
		job.PackageOp.SourceFiles = append(job.PackageOp.SourceFiles, fileToAdd)
		err := core.ObjSaveWithoutValidation(job)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/jobs/files/%s?%s", job.ID, values.Encode()))
}

// POST /jobs/delete_file/:id
func JobDeleteFile(c *gin.Context) {
	fileToDelete := c.PostForm("fullPath")
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	index := -1
	for i, filename := range job.PackageOp.SourceFiles {
		if fileToDelete == filename {
			index = i
			break
		}
	}
	if index >= 0 {
		job.PackageOp.SourceFiles = util.RemoveFromSlice[string](job.PackageOp.SourceFiles, index)
		err := core.ObjSaveWithoutValidation(job)
		if err != nil {
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
	}
	fileBrowserPath := c.PostForm("directory")
	values := url.Values{}
	values.Set("directory", fileBrowserPath)
	c.Redirect(http.StatusFound, fmt.Sprintf("/jobs/files/%s?%s", job.ID, values.Encode()))
}

func GetDirList(dirname string) ([]*util.ExtendedFileInfo, error) {
	var entries []*util.ExtendedFileInfo
	var err error
	if dirname == "" {
		entries, err = core.Dart.Paths.DefaultPaths()
	} else {
		entries, err = util.ListDirectoryWithSort(dirname)
	}
	return entries, err
}

func GetJobAndDirList(jobId, dirname string) (*core.Job, []*util.ExtendedFileInfo, error) {
	entries, err := GetDirList(dirname)
	if err != nil {
		return nil, nil, err
	}
	result := core.ObjFind(jobId)
	if result.Error != nil {
		return nil, entries, result.Error
	}
	return result.Job(), entries, nil
}

func GetParentDir(dirName string) (string, string) {
	parentDir := path.Dir(dirName)
	var parentDirShortName string
	parts := strings.Split(parentDir, string(os.PathSeparator))
	if len(parts) > 0 {
		parentDirShortName = parts[len(parts)-1]
	}
	if parentDirShortName == "" {
		parentDirShortName = parentDir
	}
	if parentDirShortName == "." {
		parentDirShortName = "Default Menu"
		parentDir = ""
	}
	return parentDir, parentDirShortName
}
