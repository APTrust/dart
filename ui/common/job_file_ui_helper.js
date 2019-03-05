
class JobFileUIHelper {
    constructor(job) {
        this.job = job;
    }

    initUI() {
        this.attachDragAndDropEvents();
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

}

module.exports.JobFileUIHelper = JobFileUIHelper;
