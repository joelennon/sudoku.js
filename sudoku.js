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
// sudoku.js
// ------------------------------------------------
// This is the heart and soul of the Sudoku game.
// It maintains the game grid, current values, the
// current state of each cell in the grid. It also
// is where all of the methods for checking, 
// solving and hinting live.
// ------------------------------------------------

var Sudoku = function() {
	// This will contain a multidimensional array with each cell
	// on the Sudoku game grid (9x9 = 81 cells)
	this.cells = new Array(9);
	
	// Create Sudoku board (2D array)
	var k = 0;
	for(var i=0;i<9;i++) {
		this.cells[i] = new Array(9);
		for(var j=0;j<9;j++,k++) {
			// Each cell has a series of properties defined
			// including row (0-8), column (0-8), sequence no. (0-80),
			// region (3x3 box squares, regions 0-8), value (0 at start),
			// valid (0 for blank, 1 for invalid, 2 for valid)
			// and an errors array for holding any conflicts
			var cell = {
				row: i,
				col: j,
				seq: k,
				// Algorithm for calculating which region the cell
				// belongs to
				region: Math.floor(j/3) + (Math.floor(i/3)*3),
				value: 0,
				valid: 0,		//0 = blank, 1 = invalid, 2 = valid
				errors: []
			};
			// Add the cell to the array
			this.cells[i][j] = cell;
		}
	}
}

// Get the value of the cell at a given row and column
Sudoku.prototype.getValueAt = function(row, col) {
	return this.cells[row][col].value;
}

// Set the value of the cell at a given row and column
Sudoku.prototype.setValueAt = function(value, row, col) {
	// If value is string, convert it to a number
	if(sudokuHelper.isString(value)) { value = parseInt(value, 10); } 
	// If value is numeric (1-9) and doesn't have the value NaN, use the value
	if(sudokuHelper.isValidNumber(value) && !isNaN(value)) {
		this.cells[row][col].value = value;
	// Otherwise, value is 0 (zero).
	} else {
		this.cells[row][col].value = 0;
	}
}

// Get a string representation of the current grid values
Sudoku.prototype.toString = function() {
	var str = '';
	for(var i=0,rows=this.cells.length;i<rows;i++) {
		var rowStr = '';
		for(var j=0,cols=this.cells[i].length;j<cols;j++) {
			rowStr += (rowStr.length > 0 ? ',' : '') + this.cells[i][j].value;
		}
		str += str.length > 0 ? '\n' : '';
		str += rowStr;
	}
	return str;
}

// Set the cell values in the grid based on a string argument.
Sudoku.prototype.loadString = function(str) {
	str = str.replace(/(\r\n|\n|\r)/gm, ';');
	var rows = str.split(';');
	for(var i=0,rowsLen=rows.length;i<rowsLen;i++) {
		var cells = rows[i].split(',');
		for(var j=0,cellsLen=cells.length;j<cellsLen;j++) {
			this.setValueAt(parseInt(cells[j], 10), i, j);
		}
	}
}

// Get the neighbouring cells of a given cell. These are the other
// cells in the given cell's row, column and region. Does not include
// the cell itself, each of the arrays have 8 values not 9.
Sudoku.prototype.getNeighbours = function(cell) {
	var neighbours = {
		row: [],
		col: [],
		region: []
	};
	for(var i=0,rows=this.cells.length;i<rows;i++) {
		for(var j=0,cols=this.cells[i].length;j<cols;j++) {
			// Check if the row/col is the same as the given cell, if so ignore it.
			if(this.cells[i][j].row === cell.row && this.cells[i][j].col !== cell.col) {
				neighbours.row.push(this.cells[i][j]);
			} else if(this.cells[i][j].col === cell.col && this.cells[i][j].row !== cell.row) {
				neighbours.col.push(this.cells[i][j]);
			}
			
			// Note this is separate to above block as a neighbouring cell can be both
			// in the same row/column and the same region as the given cell.
			if(this.cells[i][j].region === cell.region && (this.cells[i][j].row !== cell.row || this.cells[i][j].col !== cell.col)) {
				neighbours.region.push(this.cells[i][j]);
			}
		}
	}
	return neighbours;
}

// Detect if the given cell clashes with its neighbours
// Add any clashes to an array of conflict error messages.
Sudoku.prototype.neighbourClash = function(cell, neighbours) {
	cell.errors = [];
	var clash = false;
	for(var i=0,len=neighbours.row.length;i<len;i++) {
		if(cell.value === neighbours.row[i].value) { 
			clash = true; 
			cell.errors.push('Clash on row '+(cell.row+1)); 
		}
	}
	for(var i=0,len=neighbours.col.length;i<len;i++) {
		if(cell.value === neighbours.col[i].value) { 
			clash = true; 
			cell.errors.push('Clash on column '+(cell.col+1));
		}
	}
	for(var i=0,len=neighbours.region.length;i<len;i++) {
		if(cell.value === neighbours.region[i].value) { 
			clash = true; 
			cell.errors.push('Clash on region '+(cell.region+1)); 
		}
	}
	return clash;
}

// Check that each cell in the grid is valid and does not
// clash with any neighbours. Use a callback function so
// any clashing cells can be styled and flagged as invalid
// appropriately by sudoku.ui.js.
Sudoku.prototype.validityCheck = function(callbackFunction) {
	// If no callback function provided, set to an empty function
	callbackFunction = callbackFunction || function() {};
	for(var i=0,rows=this.cells.length;i<rows;i++) {
		for(var j=0,cols=this.cells[i].length;j<cols;j++) {
			var cell = this.cells[i][j];
			// If value is 0, field is empty (which is OK!)
			if(this.getValueAt(i, j) === 0) { cell.valid = 0; }
			else {
				// If cell clashes, it is invalid
				if(this.neighbourClash(cell, this.getNeighbours(cell))) { cell.valid = 1; }
				// Otherwise it is a valid field
				else { cell.valid = 2; }
			}
			// Call the callback function with the current cell as an argument
			callbackFunction(cell);
		}
	}
}

// The following functions are used for solving the puzzle programmatically

// Calculate all the possible values for a given cell
Sudoku.prototype.possibleCellValues = function(cell) {
	// Start with full array of numbers 1-9
	var possibles = [1,2,3,4,5,6,7,8,9];
	// Get the neighbours for the cell
	var neighbours = this.getNeighbours(cell);
	
	//For every neighbour value found, remove from the possibles array
	for(var i=0,len=neighbours.row.length;i<len;i++) {
		var idx = possibles.indexOf(neighbours.row[i].value); // Note, need to supply indexOf for IE!
		if(idx != -1) possibles.splice(idx, 1);
	}
	for(var i=0,len=neighbours.col.length;i<len;i++) {
		var idx = possibles.indexOf(neighbours.col[i].value);
		if(idx != -1) possibles.splice(idx, 1);
	}
	for(var i=0,len=neighbours.region.length;i<len;i++) {
		var idx = possibles.indexOf(neighbours.region[i].value);
		if(idx != -1) possibles.splice(idx, 1);
	}
	
	//Return the reduced array
	return possibles;
}

// Check if the grid currently has any errors (can't solve if it does)
Sudoku.prototype.hasErrors = function() {
	for(var i=0,rowLen=this.cells.length;i<rowLen;i++) {
		for(var j=0,colLen=this.cells[i].length;j<colLen;j++) {
			if(this.cells[i][j].valid === 1) { return true; }
		}
	}
	return false;
}

// This function determines which cell has the lowest number of possibles.
// If used by solve, it can be seeded with a list of cells that have already
// been tried which allow the puzzle to be solved using brute force methods.
Sudoku.prototype.findEasiestCell = function(exclude) {
	var puzzleSolved = true;
	// Start with 10 possibles, highest number
	var possiblesCount = 10;
	var easiestCell = {};
	for(var i=0,rowLen=this.cells.length;i<rowLen;i++) {
		for(var j=0,colLen=this.cells[i].length;j<colLen;j++) {
			var cell = this.cells[i][j];
			if(cell.value === 0) {
				// If any cell has a value of 0 (zero), the puzzle is not solved
				puzzleSolved = false;
				
				// Get the possible values for the cell
				var possibles = this.possibleCellValues(cell), numPossibles = possibles.length;
				
				// if the number of possible values is lower than the current lowest cell,
				// make this the lowest cell
				if(numPossibles < possiblesCount) {
					// If the brute force solver has already tried this, skip it and try another
					if(exclude) {
						for(var x=0,exclLen=exclude.length;x<exclLen;x++) {
							var alreadyTried = false;
							if(cell.row === exclude[x].cell.row && cell.col === exclude[x].cell.col) { 
								alreadyTried = true; 
							}
						}
					}
					// If it hasn't already been tried, set it to the easiest cell (may be overwritten
					// on further iterations)
					if(!alreadyTried) {
						possiblesCount = numPossibles;
						easiestCell.cell = cell;
						easiestCell.possibles = possibles;
					}
				}
				
				//If the number of possibles is 1, return this cell as easiest, as it can be solved simply.
				if(numPossibles === 1) {
					easiestCell.cell = cell;
					easiestCell.possibles = possibles;
					return easiestCell;
				}
			}
		}
	}
	
	if(!puzzleSolved) {
		// Return the easiest cell if the puzzle has not yet been solved.
		return easiestCell;
	} else {
		// Puzzle has been solved
		return false;
	}
}

// Give the user a hint by solving one square and telling them how the square was solved.
// Only works for cells where the number of possibles is 1 (doesn't work with puzzles that
// require brute force). Future fix: enable hints even in brute force solving.
Sudoku.prototype.hint = function() {
	// Find the easiest cell
	var easiestCell = this.findEasiestCell();
	if(easiestCell === false) { return 'The puzzle is already solved!'; }
	var len = easiestCell.possibles.length;
	if(len === 0) {
		return 'Oops! I cannot find the next answer!';
	} else if(len === 1) {
		// On easier puzzles, it should be possible to hint to the user the next step.
		// Set the value for the cell and return an informative message about how it was solved.
		this.setValueAt(easiestCell.possibles[0], easiestCell.cell.row, easiestCell.cell.col);
		return 'The only possible value to enter at row '+(easiestCell.cell.row+1)+' , column '+(easiestCell.cell.col+1)+' was '+easiestCell.possibles[0]+'.';
	} else {
		// No brute force puzzle hints (yet)
		return 'Sorry, I cannot work out the next step without using brute force!';
	}
}

// Solve the puzzle. Finds the easiest cell to start with and works back from that until
// the puzzle is completed. If all remaining cells have more than one possible value,
// the solver will use a brute force check by cloning the Sudoku object and trying different
// potential values until one of the cloned objects has solved the board.
Sudoku.prototype.solve = function() {
	// Maintain a list of "easiest cells" to exclude if they don't work the first time when
	// brute forcing the solution.
	var exclude = [];
	do {
		// Find the easiest cell and push it to the exclusion list for future iterations
		var easiestCell = this.findEasiestCell(exclude);
		exclude.push(easiestCell);
		
		// If this is false, the puzzle is solved
		if(easiestCell === false) { break; }
		var len = easiestCell.possibles.length;
		if(len === 0) {
			// If this occurs, the puzzle can't be solved.
			return false;
		} else if(len === 1) {
			// If only one possible value, set it and move on to next iteration.
			this.setValueAt(easiestCell.possibles[0], easiestCell.cell.row, easiestCell.cell.col);
		} else {
			// More than 1 possible value, clone Sudoku object and try to solve with each possible value
			for(var i=0;i<len;i++) {
				var secondarySudoku = this.clone();
				
				// Try each possible value in a separate cloned Sudoku object.
				secondarySudoku.setValueAt(easiestCell.possibles[i], easiestCell.cell.row, easiestCell.cell.col);
				
				// Recursively try to solve the cloned Sudoku objects.
				var secondaryResult = secondarySudoku.solve(false);
				
				// If a cloned object solves the puzzle, set the main Sudoku object cells to
				// the same values as the successful cloned object's cells and return true
				if(secondaryResult !== false) {
					this.cells = secondarySudoku.cells;
					return true;
				}
			}
			
			// If it gets this far it's exhausted the brute force solver and can't solve.
			return false;
		}
	} while(true);
	
	// Puzzle is solved if it gets to here
	return true;
}