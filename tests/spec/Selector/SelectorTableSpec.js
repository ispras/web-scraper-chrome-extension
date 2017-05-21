describe("Table Selector", function () {

    var $el;

    beforeEach(function () {

        this.addMatchers(selectorMatchers);

        $el = jQuery("#tests").html("");
        if ($el.length === 0) {
            $el = $("<div id='tests' style='display:none'></div>").appendTo("body");
        }
    });

    it("should extract table header columns", function () {
        var selector = new Selector({
            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            columns: [
                {
                    header: "a",
                    name: "a_renamed",
                    extract: true
                }
            ]
        });

        var $table = $("#selector-table-single-table-single-row table");
        var columns = selector.getTableHeaderColumns($table);
        expect(columns).toEqual({
            a: {
                index: 1
            }
        });
    });

    it("should return first row of vertical table with single row and two columns", function () {
        var html = "<table><tr><th>head1</th><td>data1</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr");
    });

    it("should return two rows of vertical table with two rows and two columns", function () {
        var html = "<table><tr><th>head1</th><td>data1</td></tr><tr><th>head2</th><td>data2</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr");
    });

    it("should return two rows of vertical table with two rows and three columns", function () {
        var html = "<table><tr><th>head1</th><td>data1.1</td><td>data1.2</td></tr><tr><th>head2</th><td>data2.1</td><td>data2.2</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr");
    });
    
    it("should return first row of horizontal table with two rows and two columns", function () {
        var html = "<table><tr><th>head1</th><th>head2</th></tr><tr><td>data1</td><td>data2</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr:nth-of-type(1)");
    });

    it("should return first row of horizontal table with two rows and three columns", function () {
        var html = "<table><tr><th>head1</th><th>head2</th><th>head3</th></tr><tr><td>data1</td><td>data2</td><td>data3</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr:nth-of-type(1)");
    });

    it("should return one row of table with single row", function () {
        var html = "<table><tr><td>data1</td><td>data2</td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("tr:nth-of-type(1)");
    });

    it("should get header columns from vertical table", function () {
        var html = "<table><tr><th>head1</th><td>data1</td></tr><tr><th>head2</th><td>data2</td></tr></table>";
        var tableHeaderSelector = "tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([
            { header: 'head1', name: 'head1', extract: true },
            { header: 'head2', name: 'head2', extract: true }]);
    });

    //it("should extract vertical table header columns", function () {
    //    var selector = new Selector({
    //        id: 'a',
    //        type: 'SelectorTable',
    //        multiple: false,
    //        selector: "table",
    //        columns: [
    //            {
    //                header: "header1",
    //                name: "h1",
    //                extract: true
    //            },
    //            {
    //                header: "header2",
    //                name: "h2",
    //                extract: true
    //            }
    //        ]
    //    });

    //    selector.getTableDataRowSelectorFromTableHTML($("#selector-table-vertical-table"));
    //    var dataDeferred = selector.getData($("#selector-table-vertical-table"));

    //    waitsFor(function () {
    //        return dataDeferred.state() === 'resolved';
    //    }, "wait for data extraction", 5000);

    //    runs(function () {
    //        dataDeferred.done(function (data) {
    //            expect(data).toEqual([
    //                {
    //                    h1: "value1",
    //                    h2: "value2"
    //                }
    //            ]);
    //        });
    //    });
    //});




    it("should extract single text record from one table", function () {

        var selector = new Selector({
            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            columns: [
                {
                    header: "a",
                    name: "a_renamed",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($("#selector-table-single-table-single-row"));

        waitsFor(function () {
            return dataDeferred.state() === 'resolved';
        }, "wait for data extraction", 5000);

        runs(function () {
            dataDeferred.done(function (data) {
                expect(data).toEqual([
                    {
                        a_renamed: "abc"
                    }
                ]);
            });
        });
    });

    it("should extract multiple text records from one table", function () {

        var selector = new Selector({
            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            columns: [
                {
                    header: "a",
                    name: "a_renamed",
                    extract: true
                },
                {
                    header: "b",
                    name: "b_renamed",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($("#selector-table-single-table-multiple-rows"));

        waitsFor(function () {
            return dataDeferred.state() === 'resolved';
        }, "wait for data extraction", 5000);

        runs(function () {
            dataDeferred.done(function (data) {
                expect(data).toEqual([
                    {
                        a_renamed: "aaa",
                        b_renamed: "bbb"
                    },
                    {
                        a_renamed: "ccc",
                        b_renamed: "ddd"
                    }
                ]);
            });
        });
    });

    it("should only extract records from columns which are marked as extract", function () {

        var selector = new Selector({
            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            columns: [
                {
                    header: "a",
                    name: "a_renamed",
                    extract: true
                },
                {
                    header: "b",
                    name: "b_renamed",
                    extract: false
                }
            ]
        });

        var dataDeferred = selector.getData($("#selector-table-single-table-multiple-rows"));

        waitsFor(function () {
            return dataDeferred.state() === 'resolved';
        }, "wait for data extraction", 5000);

        runs(function () {
            dataDeferred.done(function (data) {
                expect(data).toEqual([
                    {
                        a_renamed: "aaa"
                    },
                    {
                        a_renamed: "ccc"
                    }
                ]);
            });
        });
    });

    it("should return data columns based on its configuration", function () {
        var selector = new Selector({
            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            columns: [
                {
                    header: "a",
                    name: "a_renamed",
                    extract: true
                },
                {
                    header: "b",
                    name: "b_renamed",
                    extract: true
                },
                {
                    header: "c",
                    name: "c_renamed",
                    extract: false
                }
            ]
        });

        var columns = selector.getDataColumns();
        expect(columns).toEqual(['a_renamed', 'b_renamed']);
    });

    it("should return thead tr as table header selector for legacy table selectors", function () {

        var selector = new Selector({
            type: 'SelectorTable'
        });

        var headerSelector = selector.getTableHeaderRowSelector();

        expect(headerSelector).toEqual("thead tr");
    });

    it("should return tbody tr as table row selector for legacy table selectors", function () {

        var selector = new Selector({
            type: 'SelectorTable'
        });

        var headerSelector = selector.getTableDataRowSelector();

        expect(headerSelector).toEqual("tbody tr");
    });

    it("should return thead tr while selecting tableHeaderRow when single row available within thead", function () {

        var html = "<table><thead><tr><td>asd</td></tr></thead></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("thead tr");
    });

    it("should return thead tr:nth-of-type while selecting tableHeaderRow when multiple rows available within thead", function () {

        var html;

        html = "<table><thead><tr><td>asd</td></tr><tr><td>asd</td></tr></thead></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("thead tr:nth-of-type(1)");

        html = "<table><thead><tr><td></td></tr><tr><td>asd</td></tr></thead></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("thead tr:nth-of-type(2)");

        html = "<table><thead><tr><td>asd</td></tr><tr><th>asd</th></tr></thead></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("thead tr:nth-of-type(1)");

        html = "<table><thead><tr><td></td></tr><tr><th>asd</th></tr></thead></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("thead tr:nth-of-type(2)");
    });

    it("should return empty string while selecting tableHeaderRow when no rows with data available", function () {

        var html = "<table><thead><tr><td></td></tr></thead><tr><td></td></tr></table>";
        var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
        expect(tableHeaderRowSelector).toEqual("");
    });

    it("should return tbody tr while selecting tableDataRow when thead is available", function () {

        var html = "<table><thead><tr><td>asd</td></tr></thead></table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("tbody tr");
    });

    it("should return tr:nth-of-type while selecting tableDataRow when thead is not available", function () {

        var html;

        html = "<table><tr><td>asd</td></tr><tr><td>asd</td></tr></table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("tr:nth-of-type(n+2)");

        html = "<table><tr><td></td></tr><tr><td>asd</td></tr><</table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("tr:nth-of-type(n+3)");

        html = "<table><tr><td>asd</td></tr><tr><th>asd</th></tr></table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("tr:nth-of-type(n+2)");

        html = "<table><tr><td></td></tr><tr><th>asd</th></tr></table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("tr:nth-of-type(n+3)");
    });

    it("should return empty string when selecting tableDataRow with no data rows", function () {

        var html = "<table><thead><tr><td></td></tr></thead><tr><td></td></tr></table>";
        var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
        expect(tableDataRowSelector).toEqual("");
    });

    it("should get header columns from html", function () {

        var html = "<table><thead><tr><td>a</td><td>b</td></tr></thead></table>";
        var tableHeaderSelector = "thead tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([{ header: 'a', name: 'a', extract: true }, { header: 'b', name: 'b', extract: true }]);
    });

    it("should get single header column from html", function () {

        var html = "<table><thead><tr><th>header</th><td>data</td></tr></thead></table>";
        var tableHeaderSelector = "thead tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([{ header: 'header', name: 'header', extract: true }]);
    });

    it("should get vertical header columns from html", function () {

        var html = "<table><tr><th>header1</th><td>data</td></tr><tr><th>header2</th><td>data</td></tr></table>";
        var tableHeaderSelector = "tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([
            { header: 'header1', name: 'header1', extract: true },
            { header: 'header2', name: 'header2', extract: true }]);
    });


    it("should get vertical header column from html", function () {

        var html = "<table><tr><th>header1</th><td>data</td></tr></table>";
        var tableHeaderSelector = "tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([{ header: 'header1', name: 'header1', extract: true }]);
    });

    it("should get header column from html", function () {

        var html = "<table><tr><th>header1</th><th>header2</th></tr><tr><td>data1</td><td>data2</td></tr></table>";
        var tableHeaderSelector = "tr:nth-of-type(2)";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([
            { header: 'header1', name: 'header1', extract: true },
            { header: 'header2', name: 'header2', extract: true }]);
    });

    it("should ignore empty columns when getting table header columns", function () {

        var html = "<table><thead><tr><td>a</td><td> </td></tr></thead></table>";
        var tableHeaderSelector = "thead tr";
        var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderSelector, html);

        expect(headerColumns).toEqual([{ header: 'a', name: 'a', extract: true }]);
    });

    it("should extract data using specified header row", function () {

        var html = "<table>" +
            "<thead>" +
            "<tr><td>a</td><td>b</td></tr>" +
            "<tr><td>c</td><td>d</td></tr>" +
            "</thead>" +
            "<tbody>" +
            "<tr><td>e</td><td>f</td></tr>" +
            "</tbody>" +
            "</table>";

        $el.append(html);

        var selector = new Selector({

            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            tableHeaderRowSelector: "thead tr:nth-of-type(2)",
            tableDataRowSelector: "tbody tr",
            columns: [
                {
                    header: "c",
                    name: "c",
                    extract: true
                },
                {
                    header: "d",
                    name: "d",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($el);

        expect(dataDeferred).deferredToEqual([{ c: "e", d: "f" }]);
    });

    it("should extract data from specified data rows", function () {

        var html = "<table>" +
            "<thead>" +
            "<tr><td>a</td><td>b</td></tr>" +
            "<tr><td>c</td><td>d</td></tr>" +
            "</thead>" +
            "<tbody>" +
            "<tr><td>e</td><td>f</td></tr>" +
            "<tr><td>g</td><td>h</td></tr>" +
            "</tbody>" +
            "</table>";

        $el.append(html);

        var selector = new Selector({

            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            tableHeaderRowSelector: "thead tr:nth-of-type(2)",
            tableDataRowSelector: "tbody tr:nth-of-type(2)",
            columns: [
                {
                    header: "c",
                    name: "c",
                    extract: true
                },
                {
                    header: "d",
                    name: "d",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($el);

        expect(dataDeferred).deferredToEqual([{ c: "g", d: "h" }]);
    });

    it("should extract data from th data rows", function () {

        var html = "<table>" +
            "<thead>" +
            "<tr><td>a</td><td>b</td></tr>" +
            "<tr><td>c</td><td>d</td></tr>" +
            "</thead>" +
            "<tbody>" +
            "<tr><th>e</th><th>f</th></tr>" +
            "<tr><th>g</th><th>h</th></tr>" +
            "</tbody>" +
            "</table>";

        $el.append(html);

        var selector = new Selector({

            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            tableHeaderRowSelector: "thead tr:nth-of-type(2)",
            tableDataRowSelector: "tbody tr:nth-of-type(2)",
            columns: [
                {
                    header: "c",
                    name: "c",
                    extract: true
                },
                {
                    header: "d",
                    name: "d",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($el);

        expect(dataDeferred).deferredToEqual([{ c: "g", d: "h" }]);
    });

    it("should extract data only from td,th elements", function () {

        var html = "<table>" +
            "<thead>" +
            "<tr><td>a</td><td>b</td></tr>" +
            "</thead>" +
            "<tbody>" +
            "<tr><th>e</th><th><a>f</a></th></tr>" +
            "</tbody>" +
            "</table>";

        $el.append(html);

        var selector = new Selector({

            id: 'a',
            type: 'SelectorTable',
            multiple: false,
            selector: "table",
            tableHeaderRowSelector: "thead tr",
            tableDataRowSelector: "tbody tr",
            columns: [
                {
                    header: "a",
                    name: "a",
                    extract: true
                },
                {
                    header: "b",
                    name: "b",
                    extract: true
                }
            ]
        });

        var dataDeferred = selector.getData($el);

        expect(dataDeferred).deferredToEqual([{ a: "e", b: "f" }]);
    });

});