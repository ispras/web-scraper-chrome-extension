import * as $ from 'jquery';
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
		const headerRowSelector = this.getTableHeaderRowSelector();
		const columns = this.getHeaderColumnsIndices($table, headerRowSelector, this.verticalTable);
		// add missing columns
		if (this.tableAddMissingColumns) {
			Object.keys(columns).forEach(header => {
				const matchedColumn = this.columns.find(column => column.header === header);
				if (!matchedColumn) {
					this.columns.push({
						header,
						name: header,
						extract: true,
					});
				}
			});
		}
		return columns;
	}

	getVerticalDataCells(table) {
		const columnNamesToIndices = this.getTableHeaderColumns($(table));
		const dataSelector = this.getTableDataRowSelector();
		const dataColumns = this.getDataColumns();
		const dataCells = $(table).find(dataSelector);
		const isRow = dataCells[0].nodeName === 'TR';
		let result = [];

		if (isRow) {
			console.log(
				'%c Please specify row data cell selector ',
				'background: red; color: white;'
			);
			return result;
		}

		result = Array.from({
			length: dataCells.length / Object.keys(columnNamesToIndices).length,
		}).map(_ => Object());

		const firstDataColumnOffset = dataCells[0].cellIndex;
		const columnIndicesToNames = Object.fromEntries(
			Object.entries(columnNamesToIndices).map(([k, v]) => [v, k])
		);
		dataCells.each((_, dataCell) => {
			const rowIndex = this.getCellRowIndex(dataCell);

			const headerName = columnIndicesToNames[rowIndex];

			const column = dataColumns.find(column => column.header === headerName);

			if (column) {
				result[dataCell.cellIndex - firstDataColumnOffset][column.name] =
					dataCell.innerHTML;
			}
		});

		return result.filter(column => !$.isEmptyObject(column));
	}

	getCellRowIndex(tableCell) {
		return $(tableCell).closest('tr')[0].rowIndex;
	}

	getHorizontalDataCells(table) {
		const columnIndices = this.getTableHeaderColumns($(table));
		const dataColumns = this.getDataColumns();
		const rows = $(table).find(this.getTableDataRowSelector());
		const result = Array.from({ length: rows.length }).map(_ => Object());
		rows.each((rowNum, row) => {
			// helper function
			function getColumnIndex(column) {
				return columnIndices[column.header] - 1;
			}

			// count current row offsets
			const rowOffsets = dataColumns.map(column => {
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
					const headerIndex = getColumnIndex(column);
					const cell = $(row)[0].children[headerIndex - rowOffsets[headerIndex]];
					const cellText = cell.innerHTML.trim();
					result[rowNum][column.name] = cellText;

					// if we have rowSpan in cell push to further rows
					if ('rowSpan' in cell && cell.rowSpan > 1) {
						for (let i = rowNum; i < rowNum + cell.rowSpan; i++) {
							result[i][column.name] = cellText;
						}
					}
				});
		});
		return result;
	}

	async _getData(parentElement) {
		const tables = this.getDataElements(parentElement);
		const getDataCells = this.verticalTable
			? this.getVerticalDataCells
			: this.getHorizontalDataCells;
		return tables.flatMap(getDataCells.bind(this));
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

	// TODO split this method into two: one determines table orientation, second finds header row.
	getTableHeaderRowSelectorFromTableHTML(html) {
		const $table = $(html);
		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length >= 1) {
			// rows in thead
			this.tableHeaderRowSelector = '>thead tr';
			this.verticalTable = false;
		} else {
			const firstRow = $table.find('tr:first-of-type');
			if (!this.verticalTable) {
				if (firstRow.find('th:not(:empty)').length > 1) {
					// if we have more than one th in first row
					// TODO find first row without th here and in data selector
					this.tableHeaderRowSelector = '>tr:nth-of-type(1)';
					this.verticalTable = false;
				} else if (
					firstRow.find('th:first-of-type:not(:empty)').length === 1 &&
					firstRow.children().length > 1
				) {
					// this is the case of vertical table with th on first cell
					this.tableHeaderRowSelector = '>tr>th';
					this.verticalTable = true;
				} else if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
					const $rows = $table.find('tr');
					// first row with th or td
					const rowIndex = $rows.index(
						$rows.filter(':has(td:not(:empty)), :has(th:not(:empty))')[0]
					);
					this.tableHeaderRowSelector = `>tr:nth-of-type(${rowIndex + 1})`;
					this.verticalTable = false;
				} else {
					this.tableHeaderRowSelector = '>';
				}
			} else if (firstRow.find('th').length) {
				// vertical table with th on first cell
				this.tableHeaderRowSelector = '>tr>th';
				this.verticalTable = true;
			} else {
				// vertical table with only td
				this.tableHeaderRowSelector = '>tr>td:nth-of-type(1)';
				this.verticalTable = true;
			}
		}
	}

	getTableDataRowSelectorFromTableHTML(html) {
		const $table = $(html);
		if ($table.find('thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))').length) {
			// rows in tbody
			this.tableDataRowSelector = '>tbody tr';
		} else if (!this.verticalTable) {
			if ($table.find('tr td:not(:empty), tr th:not(:empty)').length) {
				const $rows = $table.find('tr');
				// first row with data
				const rowIndex = $rows.index(
					$rows.filter(':has(td:not(:empty)),:has(th:not(:empty))')[0]
				);
				this.tableDataRowSelector = `>tr:nth-of-type(n+${rowIndex + 2})`;
			}
		} else if ($table.find('th').length) {
			// vertical table with th on first cell
			this.tableDataRowSelector = '>tr>td';
		} else {
			// vertical table with only td
			this.tableDataRowSelector = '>tr>td:nth-of-type(n+2)';
		}
	}

	/**
	 * Extract table header column info from html
	 * @param $headerRow header's html
	 */
	horizontalColumnsMaker($headerRow) {
		const columns = {};
		const tableRowOffsets = {};
		/**
		 * @param tableRowNum - number of layer of our header
		 * @param nameAcc - accumulator for the name of our column
		 * @param maxSpanOffset - maximum number of columns to watch (-1 if no limits)
		 */
		function columnsMakerHelper(tableRowNum, nameAcc, maxSpanOffset) {
			const startSpanOffset =
				tableRowNum in tableRowOffsets ? tableRowOffsets[tableRowNum] : 0;
			let colSpanOffset = 0;
			for (const cell of $headerRow[tableRowNum].children) {
				const colSpan = 'colSpan' in cell ? cell.colSpan : 1;
				colSpanOffset += colSpan;
				if (colSpanOffset < startSpanOffset + 1) {
					continue;
				}
				const header = (nameAcc ? `${nameAcc} ` : '') + $(cell).text();
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

	getHeaderColumnsIndices(tableHtml) {
		const $table = $(tableHtml);
		const $headerRowColumns = $table.find(this.tableHeaderRowSelector.substr(1));
		let columns;
		if (!this.verticalTable) {
			columns = this.horizontalColumnsMaker($headerRowColumns);
		} else {
			columns = {};
			$headerRowColumns.each((i, headerElement) => {
				const header = SelectorTable.trimHeader($(headerElement).text());
				columns[header] = this.getCellRowIndex(headerElement);
			});
		}
		return columns;
	}

	getTableHeaderColumnsFromHTML(tableHtml) {
		const columns = this.getHeaderColumnsIndices(tableHtml);
		this.headerColumns = Object.keys(columns).map(header => {
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
		const html = await controller.getSelectorHTML(this);
		this.getTableHeaderRowSelectorFromTableHTML(html);
		this.getTableDataRowSelectorFromTableHTML(html);
		this.getTableHeaderColumnsFromHTML(html);
		controller._editSelector(this);
		controller.renderTableHeaderColumns(this.headerColumns);
	}
}
