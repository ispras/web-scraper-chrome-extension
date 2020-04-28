# Selectors

Web scraper has multiple selectors that can be used for different type data
extraction and for different interaction with the website. The selectors can
be divided in three groups:

-   Data extraction selectors for data extraction.
-   Link selectors for site navigation.
-   Element selectors for element selection that separate multiple records

### Data extraction selectors

Data extraction selectors simply return data from the selected element.
For example [Text selector][text-selector] extracts text from
selected element. These selectors can be used as data extraction selectors:

-   [Text selector][text-selector]
-   [Link selector][link-selector]
-   [Link popup selector][link-popup-selector]
-   [Image selector][image-selector]
-   [Document selector][document-selector]
-   [Constant Value][constant-value]
-   [Table selector][table-selector]
-   [Element attribute selector][element-attribute-selector]
-   [Element style selector][element-style-selector]
-   [HTML selector][html-selector]
-   [Grouped selector][grouped-selector]

### Link selectors

Link selectors extract URLs from links that can be later opened for data
extraction. For example if in a sitemap tree there is a _Link selector_ that has
3 child text selectors then the Web Scraper extract all urls with the _Link
selector_ and then open each link and use those child data extraction selectors
to extract data. Of course a link selector might have _Link selectors_ as child
selectors then these child _Link selectors_ would be used for further page
navigation. These are currently available _Link selectors_:

-   [Link selector][link-selector]
-   [Link popup selector][link-popup-selector]

### Element selectors

Element selectors are for element selection that contain multiple data elements.
For example an element selector might be used to select a list of items in an
e-commerce site. The selector will return each selected element as a parent
element to its child selectors. Element selectors child selectors will
extract data only within the element that the element selector gave them.
These are currently available Element selectors:

-   [Element selector][element-selector]
-   [Element scroll down selector][element-scroll-selector]
-   [Element click selector][element-click-selector]

### Input Value

This selector is used to interact with page. For example input value in search form.

-   [Input Value][input-value]

## Selector configuration options

Each selector has configuration options. Here you can see the most common ones.
Configuration options that are specific to a selector are described in
selectors documentation.

-   selector - CSS selector that selects an element the selector will be working
    on.
-   multiple - should be checked when multiple records (data rows) are going to
    be extracted with this selector. Data extracted from two or more selectors with
    multiple checked wont be merged in a single record.
-   delay - delay before selector is being used.
-   parent selectors - configure parent selectors for this selector to make the
    selector tree.

Note! A common mistake when using multiple configuration option is to create
two selectors alongside with multiple checked and expect that the scraper will
join selector values in pairs. For example if you selected pagination links and
navigation links these links couldn't be logically joined in pairs. The correct
way is to select a wrapper element with Element selector and add data selectors
as child selectors to the element selector with multiple option not checked.

[text-selector]: Selectors/Text%20selector.md
[link-selector]: Selectors/Link%20selector.md
[link-popup-selector]: Selectors/Link%20popup%20selector.md
[image-selector]: Selectors/Image%20selector.md
[element-attribute-selector]: Selectors/Element%20attribute%20selector.md
[element-style-selector]: Selectors/Element%20style%20selector.md
[table-selector]: Selectors/Table%20selector.md
[grouped-selector]: Selectors/Grouped%20selector.md
[html-selector]: Selectors/HTML%20selector.md
[element-selector]: Selectors/Element%20selector.md
[element-click-selector]: Selectors/Element%20click%20selector.md
[element-scroll-selector]: Selectors/Element%20scroll%20down%20selector.md
[document-selector]: Selectors/Document%20selector%20.md
[constant-value]: Selectors/Constant%20value.md
[input-value]: Selectors/Input%20value.md
