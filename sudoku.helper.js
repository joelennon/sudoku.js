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
// sudoku.helper.js
// ------------------------------------------------
// This script should be included before sudoku.js
// and sudoku.ui.js in the HTML file.
//
// This method allows us to clone an object
// Needed to allow a duplicate Sudoku puzzle to be
// generated to brute force where multiple
// possibilities exist for every remaining cell
//
// ------------------------------------------------
Object.prototype.clone = function() {
	var newObj = (this instanceof Array) ? [] : {};
	for (i in this) {
		if (i == 'clone') continue;
		if (this[i] && typeof this[i] == "object") {
			newObj[i] = this[i].clone();
		} else newObj[i] = this[i];
	} return newObj;
}

// SudokuHelper object takes care of things like event
// handling, type checking and other non-Sudoku things
var SudokuHelper = function() {};

// John Resig's addEvent function
// http://ejohn.org/projects/flexible-javascript-events/
SudokuHelper.prototype.addEvent = function(obj, type, fn) {
	if (obj.attachEvent) {
		obj['e'+type+fn] = fn;
		obj[type+fn] = function() { obj['e'+type+fn](window.event); }
		obj.attachEvent('on'+type, obj[type+fn]);
	} else { obj.addEventListener(type, fn, false); }
}

// Checking the [[Class]] of an object is better than
// using typeof or instanceof
// http://bonsaiden.github.com/JavaScript-Garden/#types.typeof
SudokuHelper.prototype.isValidNumber = function(obj) {
	var type = Object.prototype.toString.call(obj).slice(8, -1);
	if(type !== 'Number') { return false; }
	if(obj < 1 || obj > 9) { return false; }
	return true;
}

SudokuHelper.prototype.isString = function(obj) {
	var type = Object.prototype.toString.call(obj).slice(8, -1);
	if(type !== 'String') { return false; }
	return true;
}

// Create new SudokuHelper object. This var is used in other scripts.
var sudokuHelper = new SudokuHelper();