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
		let columns = SelectorTable.getHeaderColumnsIndices(
			$table,
			headerRowSelector,
			this.verticalTable
		);
		// add missing columns
		if (this.tableAddMissingColumns) {
			Object.keys(columns).forEach(header => {
				let matchedColumn = this.columns.find(column => column.header === header);
				if (!matchedColumn) {
					this.columns.push({
						header: header,
						name: header,
						extract: true,
					});
				}
			});
		}
		return columns;
	}

	getVerticalDataCells(table) {
		let columnIndices = this.getTableHeaderColumns($(table));
		let dataSelector = this.getTableDataRowSelector();
		let dataColumns = this.getDataColumns();
		let dataCells = $(table).find(dataSelector);
		let isRow = dataCells[0].nodeName === 'TR';
		let result = [];

		if (isRow) {
			console.log(
				'%c Please specify row data cell selector ',
				'background: red; color: white;'
			);
			return result;
		}

		result = Array.from({
			length: dataCells.length / Object.keys(columnIndices).length,
		}).map(_ => Object());
		dataCells.each((rowNum, dataCell) => {
			if (dataCell.cellIndex === 0) {
				console.log(
					"%c Vertical rows can't have first column as data cell ",
					'background: red; color: white;'
				);
			} else {
				let headerName = SelectorTable.trimHeader(
					$(dataCell)
						.closest('tr')
						.find('th, td')[0].innerText
				);

				let column = dataColumns.find(column => column.header === headerName);
				if (column) {
					result[dataCell.cellIndex - 1][column.name] = dataCell.innerText;
				}
			}
		});

		return result.filter(column => !$.isEmptyObject(column));
	}

	getHorizontalDataCells(table) {
		let columnIndices = this.getTableHeaderColumns($(table));
		let dataColumns = this.getDataColumns();
		let rows = $(table).find(this.getTableDataRowSelector());
		let result = Array.from({ length: rows.length }).map(_ => Object());
		rows.each((rowNum, row) => {
			//helper function
			function getColumnIndex(column) {
				return columnIndices[column.header] - 1;
			}

			// count current row offsets
			let rowOffsets = dataColumns.map(column => {
				return dataColumns.filter(key => {
					return (
						getColumnIndex(key) < getColumnIndex(column) && key.header in result[rowNum]
					);
				}).length;
			});

			// extract data from row
			dataColumns
				.filter(column => !(column.header in result[rowNum]))
				.forEach(column => {
					let headerIndex = getColumnIndex(column);
					let cell = $(row)[0].children[headerIndex - rowOffsets[headerIndex]];
					let cellText = cell.innerText.trim();
					result[rowNum][column.name] = cellText;

					//if we have rowSpan in cell push to further rows
					if ('rowSpan' in cell && cell.rowSpan > 1) {
						for (let i = rowNum; i < rowNum + cell.rowSpan; i++) {
							result[i][column.name] = cellText;
						}
					}
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

	getFeatures() {
		return [
			'selector',
			'multiple',
			'columns',
			'delay',
			'tableDataRowSelector',
			'tableHeaderRowSelector',
			'tableAddMissingColumns',
			'verticalTable',
		];
	}

	getItemCSSSelector() {
		return 'table';
	}

	getTableHeaderRowSelector() {
		// handle legacy selectors
		return this.tableHeaderRowSelector || 'thead tr';
	}

	getTableDataRowSelector() {
		// handle legacy selectors
		return this.tableDataRowSelector || 'tbody tr';
	}

	//TODO split this method into two: one determines table orientation, second finds header row.
	getTableHeaderRowSelectorFromTableHTML(html) {
		let $table = $(html);
		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length >= 1) {
			//rows in thead
			return {
				tableHeaderRowSelector: 'thead tr',
				verticalTable: false,
			};
		} else {
			let firstRow = $table.find('tr:first-of-type');
			if (!verticalTableHint) {
				if (firstRow.find('th:not(:empty)').length > 1) {
					// if we have more than one th in first row
					//TODO find first row without th here and in data selector
					return {
						tableHeaderRowSelector: 'tr:nth-of-type(1)',
						verticalTable: false,
					};
				} else if (
					firstRow.find('th:first-of-type:not(:empty)').length === 1 &&
					firstRow.children().length > 1
				) {
					//this is the case of vertical table with th on first cell
					return {
						tableHeaderRowSelector: 'tr>th',
						verticalTable: true,
					};
				} else if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
					let $rows = $table.find('tr');
					// first row with th or td
					let rowIndex = $rows.index(
						$rows.filter(':has(td:not(:empty)), :has(th:not(:empty))')[0]
					);
					return {
						tableHeaderRowSelector: 'tr:nth-of-type(' + (rowIndex + 1) + ')',
						verticalTable: false,
					};
				} else {
					return {
						tableHeaderRowSelector: '',
						verticalTable: verticalTableHint,
					};
				}
			} else {
				if (firstRow.find('th').length) {
					// vertical table with th on first cell
					return {
						tableHeaderRowSelector: 'tr>th',
						verticalTable: true,
					};
				} else {
					// vertical table with only td
					return {
						tableHeaderRowSelector: 'tr>td:nth-of-type(1)',
						verticalTable: true,
					};
				}
			}
		}
	}

	getTableDataRowSelectorFromTableHTML(html, verticalTable) {
		let $table = $(html);
		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length) {
			// rows in tbody
			return 'tbody tr';
		} else {
			if (!verticalTable) {
				if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
					let $rows = $table.find('tr');
					// first row with data
					let rowIndex = $rows.index(
						$rows.filter(':has(td:not(:empty)),:has(th:not(:empty))')[0]
					);
					return 'tr:nth-of-type(n+' + (rowIndex + 2) + ')';
				}
			} else {
				if ($table.find('th').length) {
					// vertical table with th on first cell
					return 'tr>td';
				} else {
					// vertical table with only td
					return 'tr>td:nth-of-type(n+2)';
				}
			}
		}
	}

	static automaticallyDetectSelectorTableAttributes(html, verticalTableHint) {
		let detectedAttributes = SelectorTable.getTableHeaderRowSelectorFromTableHTML(
			html,
			verticalTableHint
		);
		detectedAttributes.tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(
			html,
			detectedAttributes.verticalTable
		);
		detectedAttributes.headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(
			html,
			detectedAttributes.tableHeaderRowSelector,
			detectedAttributes.verticalTable
		);
		return detectedAttributes;
	}

	/**
	 * Extract table header column info from html
	 * @param $headerRow header's html
	 */
	static horizontalColumnsMaker($headerRow) {
		let columns = {};
		let tableRowOffsets = {};
		/**
		 * @param tableRowNum - number of layer of our header
		 * @param nameAcc - accumulator for the name of our column
		 * @param maxSpanOffset - maximum number of columns to watch (-1 if no limits)
		 */
		function columnsMakerHelper(tableRowNum, nameAcc, maxSpanOffset) {
			let startSpanOffset = tableRowNum in tableRowOffsets ? tableRowOffsets[tableRowNum] : 0;
			let colSpanOffset = 0;
			for (let cell of $headerRow[tableRowNum].children) {
				let colSpan = 'colSpan' in cell ? cell.colSpan : 1;
				colSpanOffset += colSpan;
				if (colSpanOffset < startSpanOffset + 1) {
					continue;
				}
				let header = (nameAcc ? nameAcc + ' ' : '') + $(cell).text();
				if (colSpan < 2) {
					columns[SelectorTable.trimHeader(header)] = Object.keys(columns).length + 1;
				} else {
					columnsMakerHelper(tableRowNum + 1, header, colSpan);
				}
				tableRowOffsets[tableRowNum] = colSpanOffset;
				if (maxSpanOffset > 0 && colSpanOffset >= maxSpanOffset + startSpanOffset) {
					return;
				}
			}
		}
		columnsMakerHelper(0, '', -1);
		return columns;
	}

	getHeaderColumnsIndices(table_html, headerRowSelector, verticalTable) {
		let $table = $(table_html);
		let $headerRowColumns = $table.find(headerRowSelector);
		let columns;
		if (!verticalTable) {
			columns = this.horizontalColumnsMaker($headerRowColumns);
		} else {
			columns = {};
			$headerRowColumns.each((i, headerElement) => {
				let header = SelectorTable.trimHeader($(headerElement).text());
				columns[header] = i + 1;
			});
		}
		return columns;
	}

	static getTableHeaderColumnsFromHTML(table_html, headerRowSelector, verticalTable) {
		let columns = SelectorTable.getHeaderColumnsIndices(
			table_html,
			headerRowSelector,
			verticalTable
		);
		return Object.keys(columns).map(header => {
			return {
				header: SelectorTable.trimHeader(header),
				name: SelectorTable.trimHeader(header),
				extract: true,
			};
		});
	}

	static trimHeader(header) {
		return header.trim().replace(/\s+/gm, ' ');
	}

	async afterSelect(cssSelector, controller) {
		await super.afterSelect(cssSelector, controller);
		let html = await controller.getSelectorHTML(this);
		this.tableHeaderRowSelector = this.getTableHeaderRowSelectorFromTableHTML(html, this.verticalTable);
		this.tableDataRowSelector = this.getTableDataRowSelectorFromTableHTML(html, this.verticalTable);
		let headerColumns = this.getTableHeaderColumnsFromHTML(this.tableHeaderRowSelector, html, this.verticalTable);
		controller._editSelector(this);
		controller.renderTableHeaderColumns(headerColumns);
	}
}
