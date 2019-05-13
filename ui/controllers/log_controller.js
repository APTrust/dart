const { BaseController } = require('./base_controller');
const { Context } = require('../../core/context');
const electron = require('electron');
const path = require('path');
const { Tail } = require('tail');
const url = require('url');

const BrowserWindow = electron.remote.BrowserWindow;
var logWindow = null;

class LogController extends BaseController {

    constructor(params) {
        super(params, 'Help');
    }

    show() {
        if (logWindow == null) {
            logWindow = new BrowserWindow({
                width: 800,
                height: 600,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            let logUrl = url.format({
                pathname: path.join(__dirname, '..', 'log_window.html'),
                protocol: 'file:',
                slashes: true
            });
            logWindow.loadURL(logUrl);
            logWindow.on('closed', () => { logWindow = null });
            logWindow.show();
            logWindow.webContents.on('did-finish-load', () => {
                logWindow.webContents.send('loadfile', Context.logger.pathToLogFile());
            });
            return this.noContent();
        }
    }

    postRenderCallback(fnName) {
        if (logWindow) {
            let tail = new Tail(Context.logger.pathToLogFile());
            tail.on("line", function(data) {
                logWindow.webContents.send('append', data + "\n");
            });
        }
    }
}

module.exports.LogController = LogController;
