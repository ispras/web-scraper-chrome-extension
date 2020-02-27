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
		let columns = {};
		let headerRowSelector = this.getTableHeaderRowSelector();
		let $headerRow = $table.find(headerRowSelector);

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
					let header = $(value)
						.text()
						.trim();
					columns[header] = {
						index: i + 1,
					};
				}.bind(this)
			);

			this.addMissingColumns($headerRow);
		}
		return columns;
	}

	addMissingColumns(headerRow) {
		headerRow.each(
			function(i, value) {
				if (this.tableAddMissingColumns) {
					let header = $(value)
						.text()
						.trim();
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

	getVerticalDataCells(table, dataSelector) {
		let selectors = $(table).find(dataSelector),
			isRow = selectors[0].nodeName === 'TR',
			result = [];

		if (isRow) {
			console.log('%c Please specify row data cell selector ', 'background: red; color: white;');
		} else {
			for (let i = 0; i < selectors.length; i++) {
				result.push({});
			}
			selectors.each(
				function(i, dataCell) {
					if (dataCell.cellIndex === 0) {
						console.log("%c Vertical rows can't have first column as data cell ", 'background: red; color: white;');
					} else {
						let headerCellName = $(dataCell)
							.closest('tr')
							.find('th, td')[0].innerText;

						let listDataColumnName = this.getDataColumnName(headerCellName);
						let dataCellvalue = dataCell.innerText;
						if (listDataColumnName) {
							result[dataCell.cellIndex - 1][listDataColumnName] = dataCellvalue;
						}
					}
				}.bind(this)
			);
		}

		return result;
	}

	_getData(parentElement) {
		let dfd = $.Deferred();
		let verticalTable = this.verticalTable;
		let tables = this.getDataElements(parentElement);

		let result = [];
		$(tables).each(
			function(k, table) {
				let dataSelector = this.getTableDataRowSelector();
				if (verticalTable) {
					let columnsList = this.getVerticalDataCells(table, dataSelector);
					columnsList.forEach(function(column) {
						if (!$.isEmptyObject(column)) {
							result.push(column);
						}
					});
				} else {
					let columnIndices = this.getTableHeaderColumns($(table));
					$(table)
						.find(dataSelector)
						.each(
							function(i, dataCell) {
								let data = {};

								this.columns.forEach(function(column) {
									let header = columnIndices[column.header.trim()];
									let rowText = $(dataCell)
										.find('>:nth-child(' + header.index + ')')
										.text()
										.trim();
									if (column.extract) {
										data[column.name] = rowText;
									}
								});
								result.push(data);
							}.bind(this)
						);
				}
			}.bind(this)
		);

		dfd.resolve(result);
		return dfd.promise();
	}

	getDataColumns() {
		let dataColumns = [];
		this.columns.forEach(function(column) {
			if (column.extract) {
				dataColumns.push(column.name);
			}
		});
		return dataColumns;
	}

	getDataColumnName(header) {
		let answer = this.columns.find(function(column) {
			return column.extract && header === column.header.trim();
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
			if ($table.find('thead tr').length === 1) {
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
	 * @param headerRowSelector
	 * @param html
	 * @param verticalTable
	 */
	static getTableHeaderColumnsFromHTML(headerRowSelector, html, verticalTable) {
		let $table = $(html);
		let $headerRowColumns = $table.find(headerRowSelector);

		let columns = [];
		if (!verticalTable) {
			if ($headerRowColumns.length > 1) {
				$headerRowColumns = $headerRowColumns.find('th:first-child');
			} else if ($headerRowColumns.find('th').length) {
				$headerRowColumns = $headerRowColumns.find('th');
			} else if ($headerRowColumns.find('td').length) {
				$headerRowColumns = $headerRowColumns.find('td');
			}
		}
		$headerRowColumns.each(function(i, columnEl) {
			let header = columnEl.innerText;
			if (header) {
				columns.push({
					header: header,
					name: header,
					extract: true,
				});
			}
		});
		return columns;
	}
}
