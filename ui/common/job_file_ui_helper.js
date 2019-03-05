const fs = require('fs');
const FileSystemReader = require('../../plugins/formats/read/file_system_reader');

class JobFileUIHelper {
    constructor(job) {
        this.job = job;
    }

    initUI() {
        this.attachDragAndDropEvents();
        this.addItemsToUI();
    }

    attachDragAndDropEvents() {
        $('#dropZone').on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('drop');
            // When drag event is attached to document, use
            // e.dataTransfer.files instead of what's below.
            for (let f of e.originalEvent.dataTransfer.files) {
                //jobFiles.addFile(f.path);
                console.log(f.path);
            }
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragover');
            $(e.currentTarget).addClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragleave');
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
        $('#dropZone').on('dragend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('dragend');
            $(e.currentTarget).removeClass('drop-zone-over');
            return false;
        });
    }

    addItemsToUI() {
        if (this.job.packageOp != null) {
            var files = this.job.packageOp.sourceFiles.slice();
            for(var filepath of files) {
                this.addItemToUI(filepath);
            }
        }
    }

    addItemToUI(filepath) {
        let stats = fs.statSync(filepath);
        if (stats.isFile()) {
            // Add row with file path, 1, 0, stats.size
            console.log(`${filepath}, 1, 0, ${stats.size}`);
        } else if (stats.isDirectory()) {
            let fsReader = new FileSystemReader(filepath);
            fsReader.on('end', function() {
                // Add row with file path, fileCount, dirCount, byteCount
                console.log(`${filepath}, ${fsReader.fileCount}, ${fsReader.dirCount}, ${fsReader.byteCount}`);
            });
            fsReader.list();
        }
    }
}

module.exports.JobFileUIHelper = JobFileUIHelper;
