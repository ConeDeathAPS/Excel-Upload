var express = require("express");

var app = express();

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/excelUpload");

app.use(express.static(__dirname + "/static"));
app.use(bodyParser.json({extended: true}));
var DataSchema = new mongoose.Schema({
	data: Array
});

var Data = mongoose.model("data", DataSchema);

app.get("/", function (req, res) {
	res.sendfile('index.html');
})

app.get("/data", function (req, res) {
	Data.find({}, function(err, datum) {
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
	var newData = new Data({data: req.body});
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