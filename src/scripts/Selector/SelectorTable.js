import Selector from '../Selector';

export default class SelectorTable extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
	}

	canHaveChildSelectors() {
		return false;
	}

	canHaveLocalChildSelectors() {
		return false;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return false;
	}

	getTableHeaderColumns($table) {
		let headerRowSelector = this.getTableHeaderRowSelector();
		let $headerRow = $table.find(headerRowSelector);
		let columns = {};
		if (this.verticalTable) {
			if ($headerRow.length > 0) {
				if ($headerRow.length > 1) {
					if ($headerRow[0].nodeName === 'TR') {
						$headerRow = $headerRow.find('th:first-child');
						if ($headerRow.length === 0) {
							console.log('%c Please specify row header cell selector ', 'background: red; color: white;');
						}
					}
				} else if ($headerRow.find('th').length) {
					$headerRow = $headerRow.find('th');
				} else if ($headerRow.find('td').length) {
					$headerRow = $headerRow.find('td');
				}
				$headerRow.each(
					function(i, value) {
						let header = SelectorTable.trimHeader($(value).text());
						columns[header] = {
							index: i + 1,
						};
					}.bind(this)
				);
				this.addMissingColumns($headerRow);
			}
		} else {
			columns = SelectorTable.columnsMaker($headerRow);
		}

		return columns;
	}

	addMissingColumns(headerRow) {
		headerRow.each(
			function(i, value) {
				if (this.tableAddMissingColumns) {
					let header = $(value).text();
					let column = $.grep(this.columns, function(h) {
						return h.name === header;
					});

					if (column.length !== 1) {
						this.columns.push({
							header: header,
							extract: true,
						});
					}
				}
			}.bind(this)
		);
	}

	getVerticalDataCells(table) {
		let dataSelector = this.getTableDataRowSelector();
		let selectors = $(table).find(dataSelector),
			isRow = selectors[0].nodeName === 'TR',
			result = [];

		if (isRow) {
			console.log('%c Please specify row data cell selector ', 'background: red; color: white;');
		} else {
			for (let i = 0; i < selectors.length; i++) {
				result.push({});
			}
			selectors.each((_, dataCell) => {
				if (dataCell.cellIndex === 0) {
					console.log("%c Vertical rows can't have first column as data cell ", 'background: red; color: white;');
				} else {
					let headerCellName = $(dataCell)
						.closest('tr')
						.find('th, td')[0].innerText;

					let listDataColumnName = this.getDataColumnName(headerCellName);
					let dataCellValue = dataCell.innerText;
					if (listDataColumnName) {
						result[dataCell.cellIndex - 1][listDataColumnName] = dataCellValue;
					}
				}
			});
		}

		return result.filter(column => !$.isEmptyObject(column));
	}

	getHorizontalDataCells(table) {
		let columnIndices = this.getTableHeaderColumns($(table));
		let rows = $(table).find(this.getTableDataRowSelector());
		let result = [];
		for (let i = 0; i < rows.length; i++) {
			result.push({});
		}
		rows.each((rowNum, row) => {
			//helper function
			function getColumnIndex(column) {
				return columnIndices[column.header] - 1;
			}
			let dataColumns = this.getDataColumns();
			// count current row offsets
			let rowOffsets = dataColumns.map(column => {
				return dataColumns.filter(key => {
					return getColumnIndex(key) < getColumnIndex(column) && key.header in result[rowNum];
				}).length;
			});
			// extract data from row
			dataColumns
				.filter(column => !(column.header in result[rowNum]))
				.forEach(column => {
					let headerIndex = getColumnIndex(column);
					let cell = $(row)[0].children[headerIndex - rowOffsets[headerIndex]];
					let cellText = cell.innerText.trim();
					if ('rowSpan' in cell && cell.rowSpan > 1) {
						//if we have rowSpan in cell push to further rows
						for (let i = rowNum; i < rowNum + cell.rowSpan; i++) {
							result[i][column.name] = cellText;
						}
					}
					result[rowNum][column.name] = cellText;
				});
		});
		return result;
	}

	_getData(parentElement) {
		let data = $.Deferred();
		let tables = this.getDataElements(parentElement);
		let result = [];
		$(tables).each((_, table) => {
			if (this.verticalTable) {
				result = result.concat(this.getVerticalDataCells(table));
			} else {
				result = result.concat(this.getHorizontalDataCells(table));
			}
		});
		data.resolve(result);
		return data;
	}

	getDataColumns() {
		return this.columns.filter(column => column.extract);
	}

	getDataColumnName(header) {
		let answer = this.columns.find(column => {
			return column.extract && header === column.header;
		});
		if (answer) {
			return answer.name;
		}
	}

	getFeatures() {
		return ['selector', 'multiple', 'columns', 'delay', 'tableDataRowSelector', 'tableHeaderRowSelector', 'tableAddMissingColumns', 'verticalTable'];
	}

	getItemCSSSelector() {
		return 'table';
	}

	getTableHeaderRowSelector() {
		// handle legacy selectors
		if (this.tableHeaderRowSelector === undefined) {
			return 'thead tr';
		} else {
			return this.tableHeaderRowSelector;
		}
	}

	getTableDataRowSelector() {
		// handle legacy selectors
		if (this.tableDataRowSelector === undefined) {
			return 'tbody tr';
		} else {
			return this.tableDataRowSelector;
		}
	}

	static getTableHeaderRowSelectorFromTableHTML(html, verticalTable) {
		let $table = $(html);

		let firstRow = $table.find('tr:first-child');

		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length) {
			if ($table.find('thead tr').length) {
				return 'thead tr';
			} else {
				let $rows = $table.find('thead tr');
				// first row with data
				let rowIndex = $rows.index($rows.filter(':has(td:not(:empty)),:has(th:not(:empty))')[0]);
				return 'thead tr:nth-of-type(' + (rowIndex + 1) + ')';
			}
		} else {
			if (!verticalTable) {
				if (firstRow.find('th:not(:empty)').length > 1) {
					return 'tr:nth-of-type(1)';
				} else if (firstRow.find('th:first-child:not(:empty)').length === 1 && firstRow.children().length > 1) {
					return 'tr';
				} else if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
					let $rows = $table.find('tr');
					// first row with data
					let rowIndex = $rows.index($rows.filter(':has(td:not(:empty)),:has(th:not(:empty))')[0]);
					return 'tr:nth-of-type(' + (rowIndex + 1) + ')';
				} else {
					return '';
				}
			} else {
				if (firstRow.find('th').length) {
					return 'tr>th';
				} else {
					return 'tr>td:nth-of-type(1)';
				}
			}
		}
	}

	static getTableDataRowSelectorFromTableHTML(html, verticalTable) {
		let $table = $(html);
		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length) {
			return 'tbody tr';
		} else {
			if (!verticalTable) {
				if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
					let $rows = $table.find('tr');
					// first row with data
					let rowIndex = $rows.index($rows.filter(':has(td:not(:empty)),:has(th:not(:empty))')[0]);
					return 'tr:nth-of-type(n+' + (rowIndex + 2) + ')';
				}
			} else {
				if ($table.find('th').length) return 'tr>td';
				else return 'tr>td:nth-of-type(n+2)';
			}
		}
	}

	/**
	 * Extract table header column info from html
	 * @param $headerRow header's html
	 */
	static columnsMaker($headerRow) {
		let columns = {};
		let tableRowOffsets = {};
		/**
		 * @param tableRowNum - number of layer of our header
		 * @param nameAcc - accumulator for the name of our column
		 * @param maxOffset - maximum number of columns to watch (-1 if no limits)
		 */
		function columnsMakerHelper(tableRowNum, nameAcc, maxOffset) {
			let startOffset = tableRowNum in tableRowOffsets ? tableRowOffsets[tableRowNum] : 0;
			let offset = 0;
			for (let cell of $headerRow[tableRowNum].children) {
				let colSpan = 'colSpan' in cell ? cell.colSpan : 1;
				offset += colSpan;
				if (offset < startOffset + 1) {
					continue;
				}
				let header = (nameAcc ? nameAcc + ' ' : '') + $(cell).text();
				if (colSpan < 2) {
					columns[SelectorTable.trimHeader(header)] = Object.keys(columns).length + 1;
				} else {
					columnsMakerHelper(tableRowNum + 1, header, startOffset + colSpan);
				}
				tableRowOffsets[tableRowNum] = offset;
				if (maxOffset > 0 && offset >= maxOffset) {
					return;
				}
			}
		}
		columnsMakerHelper(0, '', -1);
		return columns;
	}

	static getTableHeaderColumnsFromHTML(headerRowSelector, html, verticalTable) {
		let $table = $(html);
		let $headerRowColumns = $table.find(headerRowSelector);

		if (!verticalTable) {
			let columns = this.columnsMaker($headerRowColumns);
			return Object.keys(columns).map(header => {
				return {
					header: SelectorTable.trimHeader(header),
					name: SelectorTable.trimHeader(header),
					extract: true,
				};
			});
		} else {
			let columns = [];
			$headerRowColumns.each(function(i, columnEl) {
				let header = columnEl.innerText;
				if (header) {
					columns.push({
						header: SelectorTable.trimHeader(header),
						name: SelectorTable.trimHeader(header),
						extract: true,
					});
				}
			});
			return columns;
		}
	}

	static trimHeader(header) {
		return header.trim().replace(/\s+/gm, ' ');
	}
}
