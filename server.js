var express = require("express");

var app = express();

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/excelUpload");

app.use(express.static(__dirname + "/static"));
app.use(bodyParser.json({extended: true}));
var ExcelDocument = new mongoose.Schema({
	data: Object
});

var Spreadsheet = mongoose.model("spreadsheet", ExcelDocument);

app.get("/", function (req, res) {
	res.sendfile('index.html');
})

app.get("/data", function (req, res) {
	Spreadsheet.find({}, function(err, datum) {
		if (!err) {
			console.log("First lookup", datum);
			res.json(datum);
		} else {
			console.log("An error occurred!");
		}
	});
});

app.post("/data", function (req, res) {
	console.log(req.body);
	var newData = new Spreadsheet({data: req.body});
	newData.save(function (err) {
		if (!err) {
			console.log("Database addition success!");
		} else {
			console.log("Something went wrong!");
		}
	})
})

app.listen(1234, function() {
	console.log("=====1234=====");
})