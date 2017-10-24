package handlers

import (
	"fmt"
	"github.com/pkg/errors"
	"log"
	"net/http"
	"net/url"
	"time"
)

func HandleError(w http.ResponseWriter, r *http.Request, err error) {
	e := errors.WithStack(err)
	r.ParseForm()
	stacktrace := fmt.Sprintf("%+v", e)
	data := make(map[string]interface{})
	data["timestamp"] = time.Now().UTC().Format(time.RFC3339)
	data["method"] = r.Method
	data["url"] = r.URL.String()
	data["error"] = err.Error()
	data["formdata"] = r.Form
	data["stacktrace"] = stacktrace
	logErr(data)
	templates.ExecuteTemplate(w, "error", data)
}

func logErr(data map[string]interface{}) {
	log.Println(data["error"])
	log.Println(data["method"], data["url"])
	log.Println("Form Values:")
	for k, v := range data["formdata"].(url.Values) {
		log.Println("  ", k, "->", v[0])
	}
	log.Println(data["stacktrace"])
}
