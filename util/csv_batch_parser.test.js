const { CSVBatchParser } = require('./csv_batch_parser');
const { JobParams } = require('../core/job_params');
const path = require('path')

const fixturePath = path.join(__dirname, "..", "test", "fixtures");
const csvFile = path.join(fixturePath, "csv_workflow_batch.csv");

test('next() method returns all entries with correct info', () => {
    let parser = new CSVBatchParser({
        pathToFile: csvFile,
        workflowName: 'APTrust Demo Glacier-OH',
    });

    let expectedData = JSON.parse(expectedJSON);
    let jobParamsArray = parser.parseAll();

    expect(jobParamsArray.length).toEqual(expectedData.length);

    for (let i=0; i < jobParamsArray.length; i++) {
        let jobParams = jobParamsArray[i];
        let expected = JobParams.inflateFrom(expectedData[i]);
        expect(jobParams).toEqual(expected);
    }
});

const expectedJSON = `[{
	"workflowName": "APTrust Demo Glacier-OH",
	"packageName": "bag_one",
	"files": ["/users/joe/photos"],
	"tags": [{
		"tagFile": "bag-info.txt",
		"tagName": "Bag-Name",
		"userValue": "bag_one"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Root-Directory",
		"userValue": "/users/joe/photos"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Title",
		"userValue": "Bag of Photos"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Description",
		"userValue": "A bag of joe's photos"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Access",
		"userValue": "Consortia"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Source-Organization",
		"userValue": "Test University"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Custom-Tag",
		"userValue": "Custom value one"
	}],
	"_workflowObj": null,
	"_bagItProfile": null,
	"errors": {}
}, {
	"workflowName": "APTrust Demo Glacier-OH",
	"packageName": "bag_two",
	"files": ["/users/amy/music"],
	"tags": [{
		"tagFile": "bag-info.txt",
		"tagName": "Bag-Name",
		"userValue": "bag_two"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Root-Directory",
		"userValue": "/users/amy/music"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Title",
		"userValue": "Amy's Music"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Description",
		"userValue": "A whole bunch of MP3's ripped from Amy's old CD collection."
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Access",
		"userValue": "Institution"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Source-Organization",
		"userValue": "Staging University"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Custom-Tag",
		"userValue": "Custom value two"
	}],
	"_workflowObj": null,
	"_bagItProfile": null,
	"errors": {}
}, {
	"workflowName": "APTrust Demo Glacier-OH",
	"packageName": "bag_three",
	"files": ["/var/www/news"],
	"tags": [{
		"tagFile": "bag-info.txt",
		"tagName": "Bag-Name",
		"userValue": "bag_three"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Root-Directory",
		"userValue": "/var/www/news"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Title",
		"userValue": "News Site Archive"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Description",
		"userValue": "Snapshot of news site from summer 2020"
	}, {
		"tagFile": "aptrust-info.txt",
		"tagName": "Access",
		"userValue": "Restricted"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Source-Organization",
		"userValue": "University of Virginia"
	}, {
		"tagFile": "bag-info.txt",
		"tagName": "Custom-Tag",
		"userValue": "Custom value three"
	}],
	"_workflowObj": null,
	"_bagItProfile": null,
	"errors": {}
}]`
