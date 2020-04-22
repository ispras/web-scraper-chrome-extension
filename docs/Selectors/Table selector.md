# Table selector

Table selector can extract data from tables. _Table selector_ has 3 configurable CSS selectors.
The selector is for table selection.
If header is a column you can choose vertical table type with using _This is vertical table_ hint.

You can extract data from complex headers (consisting of multiple rows and substrings), as well as from complex rows(whose cells may
contain substrings).
After you have selected the selector the _Table selector_ scraper will automatically suggest you the CSS of the header
and rows based on table HTML.
If the table header is defined by th or tbody tag - the type of table is automatically determined (vertical or horizontal).

You can click Element preview on those selectors to see whether the _Table selector_ found table header and data rows correctly.
If automatic detection failed you can select header and data rows selector by yourself like you do it with table selector.
The header row selector is used to identify table columns when data is extracted from multiple pages.

Also you can rename table columns in extracted data and include only columns that you need in output data.
If new columns are found during data extraction, they could be added to the extracted data as well.

Figure 1 shows what you should select when extracting data from a table.
![Fig. 1: Selectors for table selector][table-selector-selectors]

Figure 2 shows example of complex header.

![Fig. 2: Header for table selector][table-selector-complex-header]

Figure 3 shows example of complex rows.

![Fig. 3: Rows for table selector][table-selector-complex-rows]

Figure 4 shows example of column headers renaming and excluding from final data.

![Fig. 4: Column headers renaming][table-selector-column-headers]

## Configuration options

-   selector - [CSS selector][css-selector] for the table element.
-   header row selector - [CSS selector][css-selector] for table header row.
-   data rows selector - [CSS selector][css-selector] for table data rows.
-   This is vertical table - hint that this table is vertical (with vertical header and rows)
-   Extract missing columns - new columns that was not extracted during sitemap creation will be added to the extracted data
-   multiple - multiple records are being extracted. Usually should be
    checked for Table selector because you are extracting multiple rows.
-   delay - delay the extraction

## Use cases

See [Text selector][text-selector] use cases.

[table-selector-selectors]: ../images/selectors/table/selectors.png?raw=true
[text-selector]: Text%20selector.md
[css-selector]: ../CSS%20selector.md
[table-selector-complex-rows]: ../images/selectors/table/ComplexRows.png?raw=true
[table-selector-complex-header]: ../images/selectors/table/ComplexHeader.png?raw=true
[table-selector-column-headers]: ../images/selectors/table/ColumnsHeaders.png?raw=true
