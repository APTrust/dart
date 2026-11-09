// Global JS

function loadIntoModal(method, modalTitle, url, formId = '') {
    var formData = {}
    if (method == 'post' && formId.trim() != '') {
        let form = document.getElementById(formId)
        if (form && form instanceof HTMLFormElement) {
            // Convert form data to object that can accomodate
            // multiple values for each form input (e.g. checkboxes)
            formData = multiValueFormToObject(new FormData(form))
        }
    }
    $.ajax({
        url: url,
        type: method,
        // Set second param, traditional, to true to prevent
        // jQuery from adding brackets to var names when they
        // have multiple values.
        data: jQuery.param(formData, true),
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    }).done(function (response) {
        //console.log(response)
        showModalContent(modalTitle, response)
    }).fail(function (xhr, status, err) {
        showModalContent(modalTitle, xhr.responseText)
        console.log(status)
        console.log(err)
        console.log(xhr)
    })
}

// This is a workaround for FormData, which does not
// handle multi-selects or multiple checked checkboxes.
// In this function, if the FormData object says the
// form value contains multiple selections, it adds an
// array of all selected values to the object. Otherwise,
// it adds a single string value.
function multiValueFormToObject(formData) {
    var object = {};
    formData.forEach((value, key) => {
        console.log("Key = " + key + ", Value=" + value)
        if (!Reflect.has(object, key)) {
            object[key] = value;
            return;
        }
        if (!Array.isArray(object[key])) {
            object[key] = [object[key]];
        }
        object[key].push(value);
    });
    return object;
}

function showModalContent(title, content) {
    $('#modalTitle').html(title);
    $('#modalContent').html(content);
    $('[data-toggle="popover"]').popover()
    // If the content is a form with validation errors, summarize them
    // and move focus to the summary (accessibility). When the modal is
    // opening, wait until Bootstrap has finished showing it, because
    // Bootstrap moves focus to the modal itself at that point.
    let modal = $('#modal')
    if (modal.hasClass('show')) {
        showFormErrorSummary('#modalContent')
    } else {
        modal.one('shown.bs.modal', function () {
            showFormErrorSummary('#modalContent')
        })
        modal.modal('show');
    }
}

// showFormErrorSummary looks for field validation errors (the
// <small class="form-text text-danger"> elements in the input partials)
// inside container. If any contain text, it adds a summary of the errors
// to the top of the form, with a link to each field, and moves focus to
// the summary so the screen reader reads it (accessibility, WCAG 4.1.3
// Status Messages, issues #591 and #620). Without this, a form that is
// redisplayed with errors gives screen reader users no sign that
// anything went wrong.
//
// Returns true if it found errors and showed a summary.
function showFormErrorSummary(container) {
    let scope = $(container)
    scope.find('.form-error-summary').remove()
    let errors = scope.find('small.form-text.text-danger').filter(function () {
        return $(this).text().trim() != ''
    })
    if (errors.length == 0) {
        return false
    }

    let list = $('<ul class="mb-0"></ul>')
    errors.each(function () {
        let message = $(this).text().trim()
        let fieldId = this.id.replace(/Error$/, '')
        let field = document.getElementById(fieldId)
        let label = $(`label[for="${CSS.escape(fieldId)}"]`).first().text().trim()
        let text = label ? `${label}: ${message}` : message
        let item = $('<li></li>')
        if (field) {
            // Clicking the link moves focus to the field, not just
            // scrolling to it. Some fields, such as job metadata tags
            // with default values, start out hidden; show the field
            // first so it can receive focus.
            $('<a></a>').attr('href', '#' + fieldId).text(text).on('click', function (e) {
                e.preventDefault()
                if (!$(field).is(':visible')) {
                    $(field).closest('.form-group-hidden').show()
                }
                field.focus()
            }).appendTo(item)
        } else {
            item.text(text)
        }
        list.append(item)
    })

    // No role here, because focus makes the screen reader read the
    // summary, and a role="alert" would make some of them read it twice.
    let problems = errors.length == 1 ? '1 problem' : `${errors.length} problems`
    let summary = $('<div class="alert alert-danger form-error-summary" tabindex="-1"></div>')
    $('<p class="mb-1 font-weight-bold"></p>').text(`Please correct ${problems} before continuing:`).appendTo(summary)
    summary.append(list)

    let form = errors.first().closest('form')
    if (form.length) {
        form.prepend(summary)
    } else {
        scope.prepend(summary)
    }
    summary.trigger('focus')
    return true
}

// setFieldError displays (or, with an empty message, clears) the
// validation error for the field with the specified id, and marks the
// field invalid so the screen reader reads the error when the field
// gets focus (accessibility). The input partials do the same thing for
// errors rendered by the server. Use this when JavaScript displays the
// error.
function setFieldError(fieldId, message) {
    let errorId = fieldId + 'Error'
    $('#' + errorId).text(message || '')
    let field = $('#' + fieldId)
    if (message) {
        field.attr('aria-invalid', 'true').attr('aria-describedby', errorId)
    } else {
        field.removeAttr('aria-invalid').removeAttr('aria-describedby')
    }
}

function submitFormInBackground(formId, successCallback, failureCallback) {
    console.log("submitFormInBackground")
    console.log(formId)

    let form = $(formId);
    if (form == null) {
        showAjaxAlert("Bad form id")
        return
    }
    console.log(form.serialize())
    $.ajax({
        url: form.attr('action'),
        type: 'POST',
        data: form.serialize(),
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    }).done(function (response) {
        //console.log(response)
        if (successCallback != null) {
            successCallback(response)
        }
    }).fail(function (xhr, status, err) {
        if (failureCallback != null) {
            failureCallback(xhr, status, err)
        } else {
            showAjaxError("Error: " + status)
        }
        console.log(status)
        console.log(err)
        console.log(xhr)
    })
}

// TODO: Deprecate/remove?
function showAjaxAlert(message) {
    console.log("Ajax Alert: " + message)
    $("#ajaxAlertContent").html(message)
    $("#ajaxAlert").show()
    announce($("#ajaxAlertContent").text())
}

// TODO: Deprecate/remove?
function showAjaxError(message) {
    console.log("Ajax Error: " + message)
    $("#ajaxErrorContent").html(message)
    $("#ajaxError").show()
    announce($("#ajaxErrorContent").text(), true)
}

// announce has a screen reader read a status message aloud without
// moving focus (accessibility, WCAG 4.1.3 Status Messages). It writes
// the message into one of the hidden live regions in banner_alert.html,
// or into the modal's own live regions when the modal is open, because
// some screen readers ignore live regions outside an open modal.
//
// Set assertive to true for errors. This interrupts whatever the screen
// reader is currently saying. Otherwise, the message is read when the
// screen reader finishes its current speech.
//
// The region is cleared first and the message is written after a short
// delay so that the screen reader notices the change, even when the
// same message is announced twice in a row.
function announce(message, assertive = false) {
    let modalIsOpen = $('#modal').hasClass('show')
    let id = assertive ? 'Alert' : 'Status'
    let region = $(modalIsOpen ? `#modalSr${id}` : `#sr${id}`)
    region.text('')
    setTimeout(function () {
        region.text(message)
    }, 100)
}

// showSpinner shows the loading spinner and announces message to
// screen reader users, who can't see the spinner (accessibility,
// issue #631). Use it in place of $('#spinner').show().
function showSpinner(message = 'Loading') {
    $('#spinner').show()
    announce(message)
}

// hideSpinner hides the loading spinner. It doesn't announce anything,
// because whatever replaces the spinner announces itself.
function hideSpinner() {
    $('#spinner').hide()
}

// When a page loads with form validation errors, a flash message, or an
// error message, move focus to it so the screen reader reads it first.
// Without this, the screen reader starts reading the new page and cuts
// the message off (accessibility, issue #634). Form validation errors
// come first, then error messages, then flash messages.
$(function () {
    if (showFormErrorSummary(document.body)) {
        return
    }
    let message = $('#errorMessage').length ? $('#errorMessage') : $('#flashMessage')
    if (message.length) {
        // If the URL points to a section of the page, such as
        // #questions after saving an export setup question, keep that
        // section on screen instead of scrolling up to the message.
        // The screen reader still reads the message.
        message[0].focus({ preventScroll: window.location.hash != '' })
    }
})

// copyToClipboard copies the text of copySourceId to the clipboard, then
// shows and announces the confirmation in messageDivId (accessibility,
// issue #592). The confirmation stays on screen for five seconds, long
// enough to read; it used to fade out in under two. It appears only
// after the copy succeeds. If the copy fails, a visible error is shown
// and announced instead.
function copyToClipboard(copySourceId, messageDivId) {
    let copyText = document.querySelector(copySourceId).textContent;
    let message = $(messageDivId)
    // Reset in case the user clicks Copy again before the fade finishes.
    message.stop(true, true).hide()
    message.siblings('.copy-failed').remove()
    navigator.clipboard.writeText(copyText).then(function () {
        message.show()
        announce(message.text().trim())
        message.delay(5000).fadeOut({ duration: 1000 })
    }).catch(function (err) {
        console.log(err)
        let failure = 'Could not copy to the clipboard.'
        $('<div class="text-danger copy-failed"></div>').text(failure).insertAfter(message)
        announce(failure, true)
    })
}

function submitTagDefForm(formId) {
    let onSuccess = function (response) {
        // We don't need to do anything here, since a successful
        // save results in a redirect.
        console.log("Tag definition operation succeeded")
        console.log(response)
        location.href = response.location
    }
    let onFail = function (xhr, status, err) {
        // Failure is typically a validation failure.
        // Re-display the form to show specific error messages.
        let modalTitle = $('#modalTitle').html()
        showModalContent(modalTitle, xhr.responseText)
    }
    submitFormInBackground(formId, onSuccess, onFail)
}

function submitNewTagFileForm(formId) {
    let onSuccess = function (response) {
        // We don't need to do anything here, since a successful
        // save results in a redirect.
        console.log("Created new tag file")
        console.log(response)
        location.href = response.location
    }
    let onFail = function (xhr, status, err) {
        // Failure is typically a validation failure.
        // Re-display the form to show specific error messages.
        let modalTitle = $('#modalTitle').html()
        showModalContent(modalTitle, xhr.responseText)
    }
    submitFormInBackground(formId, onSuccess, onFail)
}

// This deletes an object via XHR if the user answers yes to the question.
// On success, the endpoint will send a JSON response with location info.
// On error, it will send HTML to display in the modal dialog.
function confirmBackgroundDeletion(question, url, data) {
    confirmOperation(question, function (userApproved) {
        if (userApproved) {
            $.ajax({
                url: url,
                type: "post",
                data: data ? jQuery.param(data) : null,
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            }).done(function (response) {
                location.href = response.location
            }).fail(function (xhr, status, err) {
                console.log(xhr)
                console.log(status)
                console.log(err)
                showModalContent("Error deleting item", xhr.responseText)
            })
        }
    })
}

// This deletes an object by constructing a form with the supplied data
// and submitting it to the specified URL. This is a normal HTTP request
// (not AJAX), so any response will replace the current page.
function confirmForegroundDeletion(question, url, data) {
    confirmOperation(question, function (userApproved) {
        if (userApproved) {
            postForm(url, data)
        }
    })
}

// Use bootbox.confirm instead of window.confirm to provide a UI consistent
// with our bootstrap modal and bootbox alert. See comment on alertWithSize below.
function confirmOperation(question, callback) {
    bootbox.confirm({
        size: "small",
        message: question,
        callback: callback
    })
}

// Use bootbox alert because users can inadvertently silence window.alert()
// if they see too many of them, and then users may miss important alerts.
function alertWithSize(size, message) {
    bootbox.alert({
        size: size,
        message: message
    })
}

function postDataInBackground(url, data = {}) {
    $.ajax({
        url: url,
        type: "post",
        data: jQuery.param(data),
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
    }).done(function (response) {
        location.href = response.location
    }).fail(function (xhr, status, err) {
        showModalContent("Error", xhr.responseText)
    })
}

function postForm(url, data) {
    let form = document.createElement('form');
    form.method = 'post'
    form.action = url

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            let hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = data[key];
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}


function deleteProfile(formId) {
    confirmOperation("Delete this BagIt profile?", function (userApproved) {
        if (userApproved) {
            submitTagDefForm(formId)
        }
    })
}

function openExternalUrl(url) {
    if (typeof window.runtime !== 'undefined') {
        // Running inside a Wails window: delegate to the Go server,
        // which uses the OS to open the URL in the default browser.
        let data = { "url": url }
        $.ajax({
            url: "/open_external",
            type: "get",
            data: jQuery.param(data),
        }).done(function (response) {
            console.log("openExternalURL succeeded")
        }).fail(function (xhr, status, err) {
            alertWithSize("large", xhr.responseText)
        })
    } else {
        // Running in a regular browser: open directly in a new tab.
        window.open(url, '_blank', 'noopener,noreferrer')
    }
}

function execCmd(url) {
    $.ajax({
        url: url,
        type: "get",
    }).done(function (response) {
        console.log("Exec command succeeded")
    }).fail(function (xhr, status, err) {
        alertWithSize("large", xhr.responseText)
    })
}

// Page init
$(function () {
    $('[data-toggle="popover"]').popover()
})

