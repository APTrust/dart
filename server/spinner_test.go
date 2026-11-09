package server

import (
	"bytes"
	"html/template"
	"regexp"
	"strings"
	"testing"
)

var (
	liveRegionOpenRe = regexp.MustCompile(`<div\b[^>]*>`)
	divTagRe         = regexp.MustCompile(`<div\b[^>]*>|</div\s*>`)
)

// The loading spinner must sit inside an always-present live region so
// screen readers announce "Loading..." when it is shown.
func TestSpinnerIsInLiveRegion(t *testing.T) {
	tmpl, err := template.ParseFiles("views/partials/spinner.html")
	if err != nil {
		t.Fatalf("parse spinner partial: %v", err)
	}
	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "partials/spinner.html", nil); err != nil {
		t.Fatalf("execute spinner partial: %v", err)
	}
	out := buf.String()

	// Find the opening tag of the live region: a div that carries both
	// role="status" and aria-live="polite".
	var region []int
	for _, loc := range liveRegionOpenRe.FindAllStringIndex(out, -1) {
		tag := out[loc[0]:loc[1]]
		if strings.Contains(tag, `role="status"`) && strings.Contains(tag, `aria-live="polite"`) {
			region = loc
			break
		}
	}
	if region == nil {
		t.Fatalf("spinner is not wrapped in a live region: want a div with role=\"status\" and aria-live=\"polite\", got %s", out)
	}

	// Walk the div tags after the live region's opening tag to find its
	// matching closing tag, then check that #spinner lies inside it.
	depth := 1
	end := -1
	for _, loc := range divTagRe.FindAllStringIndex(out[region[1]:], -1) {
		tag := out[region[1]+loc[0] : region[1]+loc[1]]
		if strings.HasPrefix(tag, "</") {
			depth--
		} else {
			depth++
		}
		if depth == 0 {
			end = region[1] + loc[0]
			break
		}
	}
	if end < 0 {
		t.Fatalf("spinner live region has no closing div: got %s", out)
	}

	inner := out[region[1]:end]
	if !strings.Contains(inner, `id="spinner"`) {
		t.Errorf("spinner is not wrapped in a live region: #spinner must be inside the role=\"status\" aria-live=\"polite\" element, got %s", out)
	}
}
