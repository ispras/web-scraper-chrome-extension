var SelectorTable = {

    canReturnMultipleRecords: function() {
        return true;
    },

    canHaveChildSelectors: function() {
        return false;
    },

    canHaveLocalChildSelectors: function() {
        return false;
    },

    canCreateNewJobs: function() {
        return false;
    },

    willReturnElements: function() {
        return false;
    },

    getTableHeaderColumns: function($table, verticalTable) {
        var columns = {};
        var headerRowSelector = this.getTableHeaderRowSelector();
        var $headerRow = $table.find(headerRowSelector);

        if ($headerRow.length > 0) {
            if ($headerRow.length > 1) {
                if ($headerRow[0].nodeName === "TR") {
                    $headerRow = $headerRow.find("th:first-child");
                    if ($headerRow.length === 0) {
                        console.log("%c Please specify row header cell selector ", "background: red; color: white;");
                    }
                }
            } else if ($headerRow.find("th").length) {
                $headerRow = $headerRow.find("th");
            } else if ($headerRow.find("td").length) {
                $headerRow = $headerRow.find("td");
            }

            $headerRow.each(function(i, value) {
                var header = $(value).text().trim();
                columns[header] = {
                    index: i + 1
                };
            }.bind(this));

            this.addMissingColumns($headerRow);
        }
        return columns;
    },

    addMissingColumns(headerRow) {
        headerRow.each(function(i, value) {
            if (this.tableAddMissingColumns) {
                var header = $(value).text().trim();
                var column = $.grep(this.columns, function(h) {
                    return h.name === header;
                });

                if (column.length !== 1) {
                    this.columns.push({
                        header: header,
                        extract: true
                    });
                }
            }
        }.bind(this));
    },

    getVerticalDataCells: function(table, dataSelector) {
        var selectors = $(table).find(dataSelector),
            isRow = selectors[0].nodeName === "TR",
            result = [];

        if (isRow) {
            console.log("%c Please specify row data cell selector ", "background: red; color: white;");
        } else {
            for (var i = 0; i < (selectors.length); i++) {
                result.push({});
            }
            selectors.each(function(i, dataCell) {
                if (dataCell.cellIndex === 0) {
                    console.log("%c Vertical rows can't have first column as data cell ", "background: red; color: white;");
                } else {
                    var headerCellName = $(dataCell).closest("tr").find("th, td")[0].innerText;

                    var listDataColumnName = this.getDataColumnName(headerCellName);
                    var dataCellvalue = dataCell.innerText;
                    if (listDataColumnName) {
                        result[dataCell.cellIndex - 1][listDataColumnName] = dataCellvalue;
                    }

                }
            }.bind(this));
        }

        return result;
    },

    _getData: function(parentElement) {

        var dfd = $.Deferred();
        var verticalTable = this.verticalTable;
        var tables = this.getDataElements(parentElement);

        var result = [];
        $(tables).each(function(k, table) {
            var dataSelector = this.getTableDataRowSelector();
            if (verticalTable) {
                var columnsList = this.getVerticalDataCells(table, dataSelector);
                columnsList.forEach(function(column) {
                    if (!$.isEmptyObject(column)) {
                        result.push(column);
                    }

                });
            } else {
                var columnIndices = this.getTableHeaderColumns($(table));
                $(table).find(dataSelector).each(function(i, dataCell) {
                    var data = {};

                    this.columns.forEach(function(column) {
                        var header = columnIndices[column.header.trim()];
                        var rowText = $(dataCell).find(">:nth-child(" + header.index + ")").text().trim();
                        if (column.extract) {
                            data[column.name] = rowText;
                        }
                    });
                    result.push(data);
                }.bind(this));
            }
        }.bind(this));

        dfd.resolve(result);
        return dfd.promise();
    },

    getDataColumns: function() {

        var dataColumns = [];
        this.columns.forEach(function(column) {
            if (column.extract === true) {
                dataColumns.push(column.name);
            }
        });
        return dataColumns;
    },

    getDataColumnName: function(header) {

        var answer = this.columns.find(function(column) {
            return (column.extract && header === column.header.trim());
        });
        if (answer) {
            return answer.name;
        }

    },

    /**
     * Extract table header column info from html
     * @param html
     */
    getTableHeaderColumnsFromHTML: function(headerRowSelector, html, verticalTable) {
        var $table = $(html);
        var $headerRowColumns = $table.find(headerRowSelector);

        var columns = [];
        if (!verticalTable) {
            if ($headerRowColumns.length > 1) {
                $headerRowColumns = $headerRowColumns.find("th:first-child");
            } else if ($headerRowColumns.find("th").length) {
                $headerRowColumns = $headerRowColumns.find("th");
            } else if ($headerRowColumns.find("td").length) {
                $headerRowColumns = $headerRowColumns.find("td");
            }
        }
        $headerRowColumns.each(function(i, columnEl) {
            var header = columnEl.innerText;
            if (header) {
                columns.push({
                    header: header,
                    name: header,
                    extract: true
                });
            }
        });
        return columns;
    },

    getTableHeaderRowSelectorFromTableHTML: function(html, verticalTable) {
        var $table = $(html);
        var firstRow = $table.find("tr:first-child");
        var rowCount = $table.find("tr").length;

        if ($table.find("thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))").length) {

            if ($table.find("thead tr").length === 1) {
                return "thead tr";
            } else {
                var $rows = $table.find("thead tr");
                // first row with data
                var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
                return "thead tr:nth-of-type(" + (rowIndex + 1) + ")";
            }
        } else {
            if (!verticalTable) {
                if (firstRow.find("th:not(:empty)").length > 1) {
                    return "tr:nth-of-type(1)";
                } else if (firstRow.find("th:first-child:not(:empty)").length === 1 && firstRow.children().length > 1) {
                    return "tr";
                } else if ($table.find("tr td:not(:empty), tr th:not(:empty)").length) {
                    var $rows = $table.find("tr");
                    // first row with data
                    var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
                    return "tr:nth-of-type(" + (rowIndex + 1) + ")";
                } else {
                    return "";
                }
            } else {
                if (firstRow.find("th").length) {
                    return "tr>th";
                } else {
                    return "tr>td:nth-of-type(1)";
                }
            }


        }
    },

    getTableDataRowSelectorFromTableHTML: function(html, verticalTable) {

        var $table = $(html);
        if ($table.find("thead tr:has(td:not(:empty)), thead tr:has(th:not(:empty))").length) {

            return "tbody tr";
        } else {
            if (!verticalTable) {
                if ($table.find("tr td:not(:empty), tr th:not(:empty)").length) {
                    var $rows = $table.find("tr");
                    // first row with data
                    var rowIndex = $rows.index($rows.filter(":has(td:not(:empty)),:has(th:not(:empty))")[0]);
                    return "tr:nth-of-type(n+" + (rowIndex + 2) + ")";
                }
            } else {
                if ($table.find("th").length) return "tr>td";
                else return "tr>td:nth-of-type(n+2)";
            }

        }
    },

    getFeatures: function() {
        return ["selector", "multiple", "columns", "delay", "tableDataRowSelector", "tableHeaderRowSelector", "tableAddMissingColumns", "verticalTable"];
    },

    getItemCSSSelector: function() {
        return "table";
    },

    getTableHeaderRowSelector: function() {
        // handle legacy selectors
        if (this.tableHeaderRowSelector === undefined) {
            return "thead tr";
        } else {
            return this.tableHeaderRowSelector;
        }
    },

    getTableDataRowSelector: function() {
        // handle legacy selectors
        if (this.tableDataRowSelector === undefined) {
            return "tbody tr";
        } else {
            return this.tableDataRowSelector;
        }
    }

};
