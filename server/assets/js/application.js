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
    $('#modal').modal('show');
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
    $("#ajaxAlertMessage").html(message)
    $("#ajaxAlert").show()
}

// TODO: Deprecate/remove?
function showAjaxError(message) {
    console.log("Ajax Error: " + message)
    $("#ajaxErrorMessage").html(message)
    $("#ajaxError").show()
}

function copyToClipboard(copySourceId, messageDivId) {
    let copyText = document.querySelector(copySourceId).textContent;
    navigator.clipboard.writeText(copyText)
    $(messageDivId).show();
    $(messageDivId).fadeOut({ duration: 1800 });
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
    let data = { "url": url }
    $.ajax({
        url: "/open_external",
        type: "get",
        data: jQuery.param(data),
    }).done(function (response) {
        console.log("Show help succeeded")
    }).fail(function (xhr, status, err) {
        alertWithSize("large", xhr.responseText)
    })
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

