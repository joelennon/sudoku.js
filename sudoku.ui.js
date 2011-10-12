// License
// Copyright (c) 2011 Joe Lennon

// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
// THE SOFTWARE.

// Sudoku.js
// http://github.com/joelennon/sudoku.js/
// Last Updated Wed 12 Oct 2011 @ 2:56 am

// ------------------------------------------------
// sudoku.ui.js
// ------------------------------------------------
// All of the UI code for Sudoku.js is in this
// file. A separate object is used for UI code,
// the Sudoku object is a member of this object.
//
// This file performs things like loading puzzles,
// responding to UI events, updating style (show
// invalid fields in red, for example) and so on.
// ------------------------------------------------

var SudokuUI = function(cfg) {
	//New Sudoku board
	this.sudoku = new Sudoku();
	
	//Get the Sudoku elements
	var gridId = cfg.gridId || 'grid';
	this.inputFields = document.getElementById(gridId).getElementsByTagName('input');
	
	//Attach events to elements
	for(var i=0,len=this.inputFields.length;i<len;i++) {
		var x = i % 9,
			y = Math.floor(i / 9),
			r = Math.floor(x / 3) + (Math.floor(y / 3)*3);
			
		this.inputFields[i].sudokuCol = x;
 		this.inputFields[i].sudokuRow = y;
	 	this.inputFields[i].sudokuRegion = r;
		var that = this;
		sudokuHelper.addEvent(this.inputFields[i], 'blur', function(e) {
			that.update(e, this);
		});
		sudokuHelper.addEvent(this.inputFields[i], 'dblclick', function(e) {
			that.popupError(e, this);
		});
	}
	
	//Attach events to buttons
	sudokuHelper.addEvent(document.getElementById('btnOpenLoadWindow'), 'click', this.openLoadWindow);
	sudokuHelper.addEvent(document.getElementById('btnCancelLoad'), 'click', this.closeLoadWindow);
	sudokuHelper.addEvent(document.getElementById('btnCompletePuzzleSample'), 'click', this.useSamplePuzzle);
	sudokuHelper.addEvent(document.getElementById('btnIncorrectPuzzleSample'), 'click', this.useSamplePuzzle);
	sudokuHelper.addEvent(document.getElementById('btnIncompletePuzzleSample'), 'click', this.useSamplePuzzle);
	var that = this;
	sudokuHelper.addEvent(document.getElementById('btnStartLoad'), 'click', function(e) {
		that.loadPuzzleFromString(e, this);
	});
	sudokuHelper.addEvent(document.getElementById('btnSolvePuzzle'), 'click', function(e) {
		that.solvePuzzle(e);
	});
	sudokuHelper.addEvent(document.getElementById('btnHint'), 'click', function(e) {
		that.hint(e);
	});
}

SudokuUI.prototype.openLoadWindow = function(e) {
	if(e) { e.preventDefault(); }
	document.getElementById('winLoad').style.display = 'block';
}

SudokuUI.prototype.closeLoadWindow = function(e) {
	if(e) { e.preventDefault(); }
	document.getElementById('winLoad').style.display = 'none';
}

SudokuUI.prototype.useSamplePuzzle = function(e) {
	if(e) { e.preventDefault(); }
	var field = document.getElementById('txtPuzzle');
	switch(this.id) {
		case 'btnCompletePuzzleSample':
			field.value = 
				'1,2,3,4,5,6,7,8,9\n'+
				'4,5,6,7,8,9,1,2,3\n'+
				'7,8,9,1,2,3,4,5,6\n'+
				'2,3,4,5,6,7,8,9,1\n'+
				'5,6,7,8,9,1,2,3,4\n'+
				'8,9,1,2,3,4,5,6,7\n'+
				'3,4,5,6,7,8,9,1,2\n'+
				'6,7,8,9,1,2,3,4,5\n'+
				'9,1,2,3,4,5,6,7,8';
			break;
		case 'btnIncorrectPuzzleSample':
			field.value =
				'2,3,6,7,1,9,3,6,8\n'+
				'3,5,3,2,1,8,2,5,7\n'+
				'1,9,5,4,7,6,3,4,1\n'+
				'3,4,7,6,5,8,1,2,9\n'+
				'1,3,5,4,9,7,2,8,6\n'+
				'9,8,4,3,6,7,5,2,1\n'+
				'7,1,2,8,4,1,3,2,9\n'+
				'9,8,4,6,1,5,7,8,4\n'+
				'7,5,2,1,8,9,4,3,6';
			break;
		case 'btnIncompletePuzzleSample':
			field.value =
				'?,?,2,?,9,?,?,6,?\n'+
				'?,4,?,?,?,1,?,?,8\n'+
				'?,7,?,4,2,?,?,?,3\n'+
				'5,?,?,?,?,?,3,?,?\n'+
				'?,?,1,?,6,?,5,?,?\n'+
				'?,?,3,?,?,?,?,?,6\n'+
				'1,?,?,?,5,7,?,4,?\n'+
				'6,?,?,9,?,?,?,2,?\n'+
				'?,2,?,?,8,?,1,?,?';
			break;
	}
}

SudokuUI.prototype.loadPuzzleFromString = function(e, el) {
	e.preventDefault();
	this.sudoku.loadString(document.getElementById('txtPuzzle').value);
	this.displayValues();
	document.getElementById('txtPuzzle').value = '';
	this.closeLoadWindow();
}

SudokuUI.prototype.validityCheck = function() {
	var that = this, count = 0;
	this.sudoku.validityCheck(function(cell) {
		if(cell.valid === 1) { //Invalid! (2=valid, 0=empty)
			that.inputFields[cell.seq].className = 'invalid';
			var error = '';
			for(var i=0,len=cell.errors.length;i<len;i++) {
				error += (error.length > 0 ? '\n' : '') + cell.errors[i];
			}
			that.inputFields[cell.seq].title = error;
		} else {
			that.inputFields[cell.seq].className = '';
			that.inputFields[cell.seq].title = '';
			if(cell.valid === 2) { count++; }
		}
		
		if(count === 81) { alert("Congratulations, you have completed the puzzle!"); }
	});
}

SudokuUI.prototype.displayValues = function() {
	var fields = this.inputFields;
	for(var i=0,len=fields.length;i<len;i++) {
		fields[i].value = '';
		var value = this.sudoku.getValueAt(fields[i].sudokuRow, fields[i].sudokuCol);
		if(value !== 0) { fields[i].value = value; }
	}
	this.validityCheck();
}

SudokuUI.prototype.popupError = function(e, el) {
	if(el.title.length > 0) { alert(el.title); }
}

SudokuUI.prototype.update = function(e, el) {
	this.sudoku.setValueAt(el.value, el.sudokuRow, el.sudokuCol);
	this.validityCheck();
}

SudokuUI.prototype.hint = function(e) {
	if(e) { e.preventDefault(); }
	if(!this.sudoku.hasErrors()) {
		var hintMsg = this.sudoku.hint();
		this.displayValues();
		alert(hintMsg);
	} else {
		alert('I cannot help you when there are errors in the puzzle!');
	}
}

SudokuUI.prototype.solvePuzzle = function(e) {
	if(e) { e.preventDefault(); }
	if(!this.sudoku.hasErrors()) {
		if(this.sudoku.solve()) {
			this.displayValues();
		} else {
			alert('Could not solve the puzzle! Sorry!');
		}
	} else {
		alert('Cannot solve a puzzle with errors!');
	}
}

var game;
sudokuHelper.addEvent(window, 'load', function() {
	var config = {
		gridId: 'grid'
	}
	game = new SudokuUI(config);
});