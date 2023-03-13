const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const electron = require('electron');
const fs = require('fs')
const path = require('path');
const readLastLines = require('read-last-lines');
const Tail = require('tail').Tail;
const url = require('url');

// In Jest tests, electron.remote will not be defined.
// Otherwise it will.
const BrowserWindow = electron.remote ? electron.remote.BrowserWindow : electron.BrowserWindow;
var logWindow = null;

class LogController extends BaseController {

    constructor(params) {
        super(params, 'Help');
    }

    show() {
        if (logWindow == null || logWindow.name != "Log Window") {
            logWindow = window.open()
            logWindow.name = "Log Window"
            let title = logWindow.document.createElement('h3')
            title.innerText = Context.logger.pathToLogFile()
            logWindow.document.body.append(title)

            let note = logWindow.document.createElement('p')
            note.innerText = "Showing last 100 lines plus new messages as they appear."
            logWindow.document.body.append(note)

            let div = logWindow.document.createElement('div')
            div.style.lineHeight = '1.5rem'
            div.id = 'output'
            logWindow.document.body.append(div)

            readLastLines.read(Context.logger.pathToLogFile(), 100)
                .then(function (lines) {
                    div.innerText = lines
                    div.append(logWindow.document.createElement("hr"))
                    let newMarker = logWindow.document.createElement("p")
                    newMarker.innerText = "New messages will follow..."
                    div.append(newMarker)
                    div.append(logWindow.document.createElement("hr"))
                });
        }
        logWindow.focus()
        return this.noContent();
    }

    postRenderCallback(fnName) {
        if (logWindow) {
            let output = logWindow.document.getElementById('output')
            let tail = new Tail(Context.logger.pathToLogFile());
            tail.on("line", function (data) {
                console.log(data)
                output.append(data + "\n")
                output.append(logWindow.document.createElement('br'))
            });
            tail.on("error", function (error) {
                console.log('Tail error: ', error);
            });
        }
    }
}

module.exports.LogController = LogController;
