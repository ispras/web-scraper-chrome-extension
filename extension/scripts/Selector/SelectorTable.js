var SelectorTable = {

    canReturnMultipleRecords: function () {
        return true;
    },

    canHaveChildSelectors: function () {
        return false;
    },

    canHaveLocalChildSelectors: function () {
        return false;
    },

    canCreateNewJobs: function () {
        return false;
    },
    willReturnElements: function () {
        return false;
    },
    getTableHeaderColumns: function ($table) {
        var columns = {};
        var headerRowSelector = this.getTableHeaderRowSelector();
        var $headerRow = $table.find(headerRowSelector);
        var isVerticalRow = false;

        if ($headerRow.length > 0) {
            if ($headerRow.length > 1) {
                if ($headerRow[0].nodeName === "TR") {
                    $headerRow = $headerRow.find("th:first-child");
                    if ($headerRow.length === 0) {
                        console.log("%c Please specify row header cell selector ", "background: red; color: white;");
                    }
                }
                isVerticalRow = true;

            } else if ($headerRow.find("th").length) {
                $headerRow = $headerRow.find("th");
            } else if ($headerRow.find("td").length) {
                $headerRow = $headerRow.find("td");
            }

            $headerRow.each(function (i, value) {
                var header = $(value).text().trim();
                columns[header] = {
                    index: i + 1,
                    isVerticalHeader: isVerticalRow
                };
            }.bind(this));

            this.addMissingColumns($headerRow);
        }
        return columns;
    },

    addMissingColumns(headerRow) {
        headerRow.each(function (i, value) {
            if (this.tableAddMissingColumns) {
                var header = $(value).text().trim();
                var column = $.grep(this.columns, function (h) {
                    return h.name === header;
                });

                if (column.length !== 1) {
                    this.columns.push({
                        header: header,
                        name: header,
                        extract: true
                    });
                }
            }
        }.bind(this));
    },

    getVerticalDataCells: function (table, dataSelector) {
        var selectors = $(table).find(dataSelector),
            isRow = selectors[0].nodeName === "TR",
            result = [];

        if (isRow) {
            console.log("%c Please specify row data cell selector ", "background: red; color: white;");
        } else {
            for (var i = 0; i < (selectors.length / this.columns.length); i++) {
                result.push({});
            };

            selectors.each(function (i, dataCell) {
                if (dataCell.cellIndex == 0) {
                    console.log("%c Vertical rows can't have first column as data cell ", "background: red; color: white;");
                } else {
                    var index = (dataCell.cellIndex - 1 | dataCell.rowIndex);
                    var headerCellName = $(dataCell).closest('tr').find("th:first-child").text().trim();
                    var dataCellvalue = $(dataCell).text().trim();

                    var extractData = $.grep(this.columns, function (h) {
                        return h.name === headerCellName && h.extract;
                    }).length == 1;

                    if (extractData) {
                        result[index][headerCellName] = dataCellvalue;
                    }
                }
            }.bind(this));
        }

        return result;
    },

    _getData: function (parentElement) {

        var dfd = $.Deferred();

        var tables = this.getDataElements(parentElement);

        var result = [];
        $(tables).each(function (k, table) {
            var headerCells = this.getTableHeaderColumns($(table)),
                dataSelector = this.getTableDataRowSelector(),
                objKeys = Object.keys(headerCells),
                headerCellCount = objKeys.length,
                isVerticalHeader = headerCellCount && headerCells[Object.keys(headerCells)[0]].isVerticalHeader;

            if (isVerticalHeader) {
                var results = this.getVerticalDataCells(table, dataSelector);
                result.push.apply(result, results);
            } else {
                $(table).find(dataSelector).each(function (i, dataCell) {
                    var data = {};

                    this.columns.forEach(function (headerCell) {
                        if (headerCell.extract === true) {
                            if (headerCells[headerCell.header] === undefined) {
                                data[headerCell.name] = null;
                            }
                            else {
                                var header = headerCells[headerCell.header];
                                var rowText = $(dataCell).find(">:nth-child(" + header.index + ")").text().trim();
                                data[headerCell.name] = rowText;
                            }
                        }
                    });
                    result.push(data);
                }.bind(this));
            }
        }.bind(this));

        dfd.resolve(result);
        return dfd.promise();
    },

    getDataColumns: function () {

        var dataColumns = [];
        this.columns.forEach(function (column) {
            if (column.extract === true) {
                dataColumns.push(column.name);
            }
        });
        return dataColumns;
    },

    getFeatures: function () {
        return ['selector', 'multiple', 'columns', 'delay', 'tableDataRowSelector', 'tableHeaderRowSelector', 'tableAddMissingColumns']
    },

    getItemCSSSelector: function () {
        return "table";
    },

    getTableHeaderRowSelectorFromTableHTML: function (html) {
        var $table = $(html);
        var firstRow = $table.find("tr:first-child");
        var rowCount = $table.find("tr").length;
        if ($table.find("thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))").length) {

            if ($table.find("thead tr").length === 1) {
                return "thead tr";
            }
            else {
                var $rows = $table.find("thead tr");
                // first row with data
                var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
                return "thead tr:nth-of-type(" + (rowIndex + 1) + ")";
            }
        }
        else if (firstRow.find("th:not(:empty)").length > 1) {
            return "tr:nth-of-type(1)";
        }
        else if (firstRow.find("th:first-child:not(:empty)").length == 1 && firstRow.children().length > 1) {
            return "tr";
        }
        else if ($table.find("tr td:not(:empty), tr th:not(:empty)").length) {
            var $rows = $table.find("tr");
            // first row with data
            var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
            return "tr:nth-of-type(" + (rowIndex + 1) + ")";
        }
        else {
            return "";
        }
    },

    getTableDataRowSelectorFromTableHTML: function (html) {

        var $table = $(html);
        if ($table.find("thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))").length) {

            return "tbody tr";
        }
        else if ($table.find("tr td:not(:empty), tr th:not(:empty)").length) {
            var $rows = $table.find("tr");
            // first row with data
            var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
            return "tr:nth-of-type(n+" + (rowIndex + 2) + ")";
        }
        else {
            return "";
        }
    },

    getTableHeaderRowSelector: function () {

        // handle legacy selectors
        if (this.tableHeaderRowSelector === undefined) {
            return "thead tr";
        }
        else {
            return this.tableHeaderRowSelector;
        }
    },

    getTableDataRowSelector: function () {

        // handle legacy selectors
        if (this.tableDataRowSelector === undefined) {
            return "tbody tr";
        }
        else {
            return this.tableDataRowSelector;
        }
    },

    /**
     * Extract table header column info from html
     * @param html
     */
    getTableHeaderColumnsFromHTML: function (headerRowSelector, html) {

        var $table = $(html);
        var $headerRowColumns = $table.find(headerRowSelector);

        if ($headerRowColumns.length > 1) {
            $headerRowColumns = $headerRowColumns.find("th:first-child")
        } else if ($headerRowColumns.find("th").length) {
            $headerRowColumns = $headerRowColumns.find("th");
        } else if ($headerRowColumns.find("td").length) {
            $headerRowColumns = $headerRowColumns.find("td");
        }

        var columns = [];

        $headerRowColumns.each(function (i, columnEl) {
            var header = $(columnEl).text().trim();
            var name = header;
            if (header.length !== 0) {
                columns.push({
                    header: header,
                    name: name,
                    extract: true
                });
            }
        });
        return columns;
    }
};
