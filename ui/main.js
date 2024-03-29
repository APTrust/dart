const {app, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const process = require('process');
const url = require('url');
const { InternalSetting } = require('../core/internal_setting');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
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

    // We have to save these now, because we can no longer
    // access electron.app outside of main.js.
    new InternalSetting({
        id: 'ec0c9c5c-5568-4cf2-a881-1cbb5eff4578',
        name: "AppPath",
        value: app.getAppPath(),
    }).save()
    new InternalSetting({
        id: '6ab9c4af-53d0-48a2-963b-481d6ef775d9',
        name: "UserDataPath",
        value: app.getPath('userData'),
    }).save()

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
