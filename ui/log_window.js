const ipc = require('electron').ipcRenderer;
const fs = require('fs');

// Load contents of file into body.
ipc.on('loadfile', (event, filepath) => {
    fs.readFile(filepath, (err, data) => {
        appendAndScroll(data)
    });
});

ipc.on('append', (event, data) => {
    appendAndScroll(data)
});

function appendAndScroll(data) {
    document.body.appendChild(document.createTextNode(data));
    window.scrollTo(0,document.body.scrollHeight);
}
