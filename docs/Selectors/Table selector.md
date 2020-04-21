# Table selector

Table selector can extract data from tables. _Table selector_ has 3 configurable CSS selectors.
The selector is for table selection. If header is a column you can choose vertical table type
with using _This is vertical table_ hint. You can extract data from complex headers
(consisting of multiple rows and substrings), as well as from complex rows(whose cells may
contain substrings). After you have selected the selector the _Table selector_ scraper will
automatically suggest you the CSS of the header and rows If the table header is defined by
th or tbody tag - the table type is automatically determined (vertical or horizontal).
You can also try to guess selectors for header row and data rows. You can click Element preview on
those selectors to see whether the
_Table selector_ found table header and data rows correctly.The header row selector is used to
identify table columns when data is extracted from multiple pages. Also you can rename table columns.
If new columns are found during data extraction, they will be added to the extracted data as well.

Figure 1 shows what you should select when extracting data from a table.
![Fig. 1: Selectors for table selector][table-selector-selectors]

Figure 2 shows example of complex header.

![Fig. 2: Header for table selector][table-selector-complex-header]

Figure 3 shows example of complex rows.

![Fig. 3: Rows for table selector][table-selector-complex-rows]

## Configuration options

-   selector - [CSS selector][css-selector] for the table element.
-   header row selector - [CSS selector][css-selector] for table header row.
-   data rows selector - [CSS selector][css-selector] for table data rows.
-   This is vertical table - table is being vertical (with vertical header and rows)
-   Extract missing columns - missing columns will be added to the extracted data
-   multiple - multiple records are being extracted. Usually should be
    checked for Table selector because you are extracting multiple rows.
-   delay - delay the extraction

## Use cases

See [Text selector][text-selector] use cases.

[table-selector-selectors]: ../images/selectors/table/selectors.png?raw=true
[text-selector]: Text%20selector.md
[css-selector]: ../CSS%20selector.md
[table-selector-complex-rows]: ../images/selectors/table/complexRows.png
[table-selector-complex-header]: ../images/selectors/table/complexHeader.png
