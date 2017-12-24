const path = require('path');
const Choice = require(path.resolve('electron/easy/core/choice'));
const Const = require(path.resolve('electron/easy/core/constants'));
const Field = require(path.resolve('electron/easy/core/field'));
const Form = require(path.resolve('electron/easy/core/form'));
const Util = require(path.resolve('electron/easy/core/util'));
const ValidationResult = require(path.resolve('electron/easy/core/validation_result'));

const Store = require('electron-store');
var db = new Store({name: 'storage-services'});

module.exports = class StorageService {
    constructor(name) {
        this.id = Util.uuid4();
        this.name = name;
        this.description = "";
        this.protocol = "";
        this.host = "";
        this.port = "";
        this.bucket = "";
        this.loginName = "";
        this.loginPassword = "";
        this.loginExtra = "";
    }
    objectType() {
        return 'StorageService';
    }
    validate() {
        var result = new ValidationResult();
        if (Util.isEmpty(this.id)) {
            result.errors["id"] = "Id cannot be empty";
        }
        if (Util.isEmpty(this.name)) {
            result.errors["name"] = "Name cannot be empty";
        }
        if (Util.isEmpty(this.protocol)) {
            result.errors["protocol"] = "Protocol cannot be empty";
        }
        if (Util.isEmpty(this.host)) {
            result.errors["host"] = "Host cannot be empty";
        }
        if (!Util.isEmpty(this.port) && parseInt(this.port, 10) != this.port) {
            result.errors["port"] = "Port must be a whole number, or leave blank to use the default port.";
        }
        return result
    }
    toForm() {
        var form = new Form('storageServiceForm');
        form.fields['id'] = new Field('storageServiceId', 'id', 'id', this.id);
        form.fields['name'] = new Field('storageServiceName', 'name', 'Name', this.name);
        form.fields['description'] = new Field('storageServiceDescription', 'description', 'Description', this.description);
        form.fields['protocol'] = new Field('storageServiceProtocol', 'protocol', 'Protocol', this.protocol);
        form.fields['protocol'].choices = Choice.makeList(Const.TransferProtocols, this.protocol, true);
        form.fields['host'] = new Field('storageServiceHost', 'host', 'Host', this.host);
        form.fields['host'].help = "The name of the server to connect to. For example, s3.amazonaws.com."
        form.fields['port'] = new Field('storageServicePort', 'port', 'Port', this.port);
        form.fields['port'].help = "The port number to connect to. Leave this blank if you're in doubt."
        form.fields['bucket'] = new Field('storageServiceBucket', 'bucket', 'Bucket or Default Folder', this.bucket);
        form.fields['loginName'] = new Field('storageServiceLoginName', 'loginName', 'Login Name', this.loginName);
        form.fields['loginName'].help = "Login name or S3 Access Key ID.";
        form.fields['loginPassword'] = new Field('storageServiceLoginPassword', 'loginPassword', 'Password or Secret Key', this.loginPassword);
        form.fields['loginPassword'].help = "Password or S3 secret access key.";
        form.fields['loginExtra'] = new Field('storageServiceLoginExtra', 'loginExtra', 'Login Extra', this.loginExtra);
        form.fields['loginExtra'].help = "Additional login info to pass to the service. Most services don't use this.";
        return form
    }
    static fromForm() {
        var name = $('#storageServiceName').val().trim();
        var service = new StorageService(name);
        service.id = $('#storageServiceId').val().trim();
        service.description = $('#storageServiceDescription').val().trim();
        service.protocol = $('#storageServiceProtocol').val().trim();
        service.host = $('#storageServiceHost').val().trim();
        service.port = $('#storageServicePort').val().trim();
        service.bucket = $('#storageServiceBucket').val().trim();
        service.loginName = $('#storageServiceLoginName').val().trim();
        service.loginPassword = $('#storageServiceLoginPassword').val().trim();
        service.loginExtra = $('#storageServiceLoginExtra').val().trim();
        return service
    }
    save() {
        return db.set(this.id, this);
    }
    static find(id) {
        var service = null;
        var obj = db.get(id);
        if (obj != null) {
            service = new StorageService();
            Object.assign(service, obj);
        }
        return service;
    }
    delete() {
        db.delete(this.id);
        return this;
    }
    static getStore() {
        return db.store;
    }
}
