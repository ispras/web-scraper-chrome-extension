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
                    $headerRow = $headerRow.find("th:first-child")
                }
                isVerticalRow = true;
            } else if ($headerRow.find("th").length) {
                $headerRow = $headerRow.find("th");
            } else if ($headerRow.find("td").length) {
                $headerRow = $headerRow.find("td");
            }

            $headerRow.each(function (i) {
                var header = $(this).text().trim();
                columns[header] = {
                    index: i + 1,
                    isVerticalHeader: isVerticalRow
                };
            });
        }
        return columns;
    },
    _getData: function (parentElement) {

        var dfd = $.Deferred();

        var tables = this.getDataElements(parentElement);

        var result = [];
        $(tables).each(function (k, table) {
            var headerCells = this.getTableHeaderColumns($(table));
            var dataSelector = this.getTableDataRowSelector();
                       
            var objKeys = Object.keys(headerCells);
            if (objKeys.length && headerCells[Object.keys(headerCells)[0]].isVerticalHeader) {
                objKeys.each(function (i) {
                    result.push({});
                })

                $(table).find(dataSelector).each(function (i, dataCell) {
                    var index = (dataCell.cellIndex -1 | dataCell.rowIndex);
                    var headerCellName = $(dataCell).closest('tr').find(":first-child").text().trim();
                    var dataCellvalue = $(dataCell).text().trim();
                    result[index][headerCellName] = dataCellvalue;
                });
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
        return ['multiple', 'columns', 'delay', 'tableDataRowSelector', 'tableHeaderRowSelector']
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
