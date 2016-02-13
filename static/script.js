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
		//this will hold all sheets, if there are multiple
		//push each sheetname into an array
		for (var i = 0; i < xlsxObject.SheetNames.length; i++) {
			console.log("Working with sheet", xlsxObject.SheetNames[i]);
			var thisSheetName = xlsxObject.SheetNames[i];
			//this is the sheet object
			var thisSheet = xlsxObject.Sheets[xlsxObject.SheetNames[i]];
			//this is an array of all the cell names in this sheet that contain something
			var cellsInThisSheet = Object.keys(thisSheet);
			// console.log("Cells in this sheet", cellsInThisSheet);
			//this will hold the headers with their column data in them
			var headers = {};
			//call the columnFinder() function and store the result, which will be the row that most likely contains the column headers
			var headerRow = columnFinder(Object.getOwnPropertyNames(thisSheet), thisSheet['!ref']);
			console.log("Row", headerRow, "contains the column headers");
			//now that we know what row the headers are in, we need to get the actual content of the headers
			for (i = 0; i < cellsInThisSheet.length; i++) {
				if (cellsInThisSheet[i] != "!ref" && cellsInThisSheet[i] != "!merge") {
					//if we have found a header
					if (parseRowNumber(cellsInThisSheet[i]) == headerRow) {
						//begin creating the structure to put that columns contents in an array
						var thisHeader = thisSheet[cellsInThisSheet[i]].w;
						//initialize the array for this column
						headers[thisHeader] = [];
						//go through the sheet again and add everything in the column below the header, but not the header itself again
						for (var each in thisSheet) {
							//if we are in the same column, and below the header, then add the data into the column array
							if (each != cellsInThisSheet[i] && parseColumnLetter(each) == parseColumnLetter(cellsInThisSheet[i])) {
								if (parseRowNumber(each) > parseRowNumber(cellsInThisSheet[i])) {
									headers[thisHeader].push(thisSheet[each].w);
								}
							}
						}
					}
				}
			}
			finalObject[thisSheetName] = headers;
		}
		return finalObject;
	}
	//this is a min function that takes an array of cell names, splits off the letter, and interpolates where the column headings are 
	//by looking for the first (lowest number) row where there are many entries. Returns the row number where it thinks the column headers are.
	var columnFinder = function(cellNames, rowRange) {
		var rows = {};
		console.log("Parsing through to find the row that contains column names...");
		console.log("Stripping letters off and omitting unecessary items...");
		for (var i = 0; i < cellNames.length; i++) {
			//ignore !ref and !merges properties for now
			if (cellNames[i] != "!merges" && cellNames[i] != "!ref") {
				//grab the row number, and count the number of entries in each row
				row = parseRowNumber(cellNames[i]);
				//if this row hasn't been seen yet, then initialize the peroperty with a value of 1
				if (!rows[row]) {
					rows[row] = 1
				//otherwise, increment the counter for that row
				} else {
					rows[row] += 1; 
				}
			}
		}
		// console.log(rows);
		//store first and last rows from the !ref property
		var firstRow = parseRowNumber(rowRange.split(":")[0]);
		var lastRow = parseRowNumber(rowRange.split(":")[1]);
		// console.log("First row is row", firstRow, "and last row is row", lastRow, ".");
		var columnHeaderRow;
		//search through the rows object and find the first column that has more than 1 entry in it, this is most likely the header row
		for (i = firstRow; i <= lastRow; i++) {
			if (rows[i]) {
				if (rows[i] > 1) {
					return i;
				}	
			}
		}
	}
	//this function retrieves only the numbers from each cell name (i.e. A14 would return just 14)
	var parseRowNumber = function(name) {
		var cursor = 0;
		var row = "";
		//while we have not gone off the end of the string
		while (name[cursor] != undefined) {
			//if the character the cursor is at is a number, then add it to the row number, otherwise move on
			if (!isNaN(name.charAt(cursor))) {
				row += name.charAt(cursor);
				cursor++;
			} else {
				cursor++;
			}
		}
		return row;
	}
	var parseColumnLetter = function(name) {
		var cursor = 0;
		var column = "";
		//while we have not gone off the end of the string
		while (name[cursor] != undefined) {
			//if the character the cursor is at is a number, then add it to the row number, otherwise move on
			if (isNaN(name.charAt(cursor))) {
				column += name.charAt(cursor);
				cursor++;
			} else {
				cursor++;
			}
		}
		return column;
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
			//calls parseWorkbook() (which causes a great deal to happen) and stores the parsed JSON object as the workbook
			var workbook = parseWorkbook(xlsxObject);
			console.log(workbook);
			dataFactory.sendContents(workbook);
			$scope.datum.push(workbook);
			console.log($scope.datum);
		};
		reader.readAsBinaryString(file);	
	}
});