var angularExcel = angular.module("angularExcel", ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'index.html',
		controller: 'dataController'
	});
});
//========================FACTORY=========================//
angularExcel.factory("dataFactory", function ($http) {
	var datum = [];

	var factory = {};

	//retrieve database entries on page load
	factory.getData = function (callback) {
		$http.get("/data")
		.then(function (res) {
			console.log("Got data");
			//if there is stuff in the database, then bring it on through to the front end
			if (res.data[0]) {
				datum.push(res.data[0].data);
				callback(datum);	
				//otherwise, do nothing				
			} else {
				console.log("Database is empty");
			}
		}, function (res) {
			console.log("An error occurred while getting data.");
			console.log(res);
		})
		
	}
	//send a new spreadsheet to the database
	factory.sendContents = function (file) {
		console.log("sending stuff");
		$http.post("/data", file)
		.then(function (res) {
			console.log("Success!", res);
		}, function (res) {
			console.log("error!", res);
		})
	}

	return factory;
});
//========================CONTROLLER=========================//
angularExcel.controller("dataController", function ($scope, dataFactory) {
	$scope.datum = [];

	//initial function to sync $scope.datum to factory data
	dataFactory.getData(function (data) {
		$scope.datum = data;
		console.log(data);
	})

	//====================WORKBOOK PARSING FUNCTIONS===================//
	//this is a private function used to parse the large workbook object into a format that is more useable
	var parseWorkbook = function(xlsxObject) {
		var finalObject = {};
		console.log(xlsxObject);
		//this will hold all sheets, if there are multiple
		//push each sheetname into an array
		for (i = 0; i < xlsxObject.SheetNames.length; i++) {
			var thisSheet = xlsxObject.Sheets[xlsxObject.SheetNames[i]];
			//call the columnFinder() function and store the result, which will be the row that most likely contains the column headers
			var columns = columnFinder(Object.getOwnPropertyNames(thisSheet));
			var tempObj = {};


			// finalObject[xlsxObject.SheetNames[i]] = 
		}
		console.log(finalObject);

		return true;
	}
	//this is a min function that takes an array of cell names, splits off the letter, and interpolates where the column headings are 
	//by looking for the first (lowest number) row where there are many entries. Returns 
	var columnFinder = function(cellNames) {
		var rows = {};
		var firstRow;
		var lastRow;
		console.log("Parsing through to find column names...");
		console.log(cellNames);
		console.log("Stripping letters off...");
		for (var i = 0; i < cellNames.length; i++) {
			//ignore ref and merges properties
			if (cellNames[i] != "!merges" && cellNames[i] != "!ref") {
				var row = "";
				//pulling the row number from each cell name, which will also give us the number of cells with data in each row (this is held in the rows object)
				//{rownumber: numberofentries, rownumber: numberofentries, ...}
				//this enables us to handle all row numbers
				var cursor = 0;
				while (cellNames[i][cursor] != undefined) {
					if (!isNaN(cellNames[i].charAt(cursor))) {
						row += cellNames[i].charAt(cellNames[i].length-1);
						cursor++;
					} else {
						cursor++;
					}
				}
				console.log(row);
				//increment data count for each row
				if (!rows[row]) {
					rows[row] = 1
				} else {
					rows[row] += 1; 
				}
			}
		}
		console.log(rows);
	}

	//when we receive a new file, use the XLSX reader and parse through to what we want
	$scope.newFile = function () {
		var fileContents = [];			
		var file = document.getElementById('file').files[0];
		var reader = new FileReader();
		reader.onloadend = function (e) {
			var data = e.target.result;
			//this creates the object that contains the parsed workbook contents
			var xlsxObject = XLSX.read(data, {type: 'binary'});
			//calls the parseWorkbook function and stores the parsed JSON object as the workbook
			var workbook = parseWorkbook(xlsxObject);
			

			//we dont want the first property name, which is !ref and does nothing for us
			// for (i = 1; i < wantedContentNames.length; i++) {
			// 	var lastChar = wantedContentNames[i].charAt(wantedContentNames[i].length-1);
			// 	var prevChar = wantedContentNames[i].charAt(wantedContentNames[i].length-2);
			// 	console.log(lastChar);				
			// 	if (lastChar === "1" && isNaN(parseInt(prevChar))) {
			// 		//grab the string value of the property and push it into this local array
			// 		fileContents.push(allContents[wantedContentNames[i]].w);
			// 		console.log(fileContents);
			// 	}
			// }
			//push the array into the complete array of all uploads
			// $scope.datum.push(fileContents);
			// console.log($scope.datum);
		};
		reader.readAsBinaryString(file);	
	}
});