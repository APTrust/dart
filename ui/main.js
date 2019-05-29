const {app, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const process = require('process');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: { nodeIntegration: true },
        icon: path.join(__dirname, 'include/img/dart.png')
    });

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    contextMenu({ showInspectElement: true });

    // Open the DevTools.
    // win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

// Create the main window when the app is ready.
app.on('ready', createWindow);


// Export these two vars. The top-level main.js script will
// assign their values to global vars, which Electron requires.
module.exports.win = win;
module.exports.app = app;
