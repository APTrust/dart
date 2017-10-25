package handlers

import (
	"fmt"
	"github.com/pkg/errors"
	"log"
	"net/http"
	"net/url"
	"time"
)

// WrapErr adds a stack trace to an error and returns the error.
// If param err is nil, this returns nil.
func WrapErr(err error) error {
	return errors.WithStack(err)
}

// HandleError returns an error page with details about what went wrong.
// Use this only for unrecoverable errors. Param err should be an error
// wrapped by github.com/pkg/errors.Wrap(err) or github.com/pkg/errors.WithStack(err)
// if you want to print the full stack track.
func HandleError(env *Environment, w http.ResponseWriter, r *http.Request, err error) {
	r.ParseForm()
	stacktrace := fmt.Sprintf("%+v", err)
	data := make(map[string]interface{})
	data["timestamp"] = time.Now().UTC().Format(time.RFC3339)
	data["method"] = r.Method
	data["url"] = r.URL.String()
	data["error"] = err.Error()
	data["formdata"] = r.Form
	data["stacktrace"] = stacktrace
	logErr(data)
	env.ExecTemplate(w, "error", data)
}

// logErr prints the error details to the log. This is the same info
// sent to the client UI by HandleError.
func logErr(data map[string]interface{}) {
	log.Println(data["method"], data["url"])
	log.Println("Error:", data["error"])
	log.Println("Form Values:")
	for k, v := range data["formdata"].(url.Values) {
		log.Println("  ", k, "->", v[0])
	}
	log.Println("Stack Trace:\n\n", data["stacktrace"], "\n")
}
