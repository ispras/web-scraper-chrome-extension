# Element attribute selector

Element attribute selector can extract an attributes value of an HTML element.
For example you could use this selector to extract title attribute from
this link: `<a href="#" title="my title">link<a>`.

## Configuration options

-   selector - [CSS selector][css-selector] for the element.
-   multiple - multiple records are being extracted.
-   attribute name - the attribute that is going to be extracted. For example
    `title`, `data-id`.
-   remove HTML
-   trim text
-   replace text - regular expression in the replace field possible
-   text prefix/suffix
-   delay - delay the extraction

## Use cases

See [Text selector][text-selector] use cases.

[text-selector]: Text%20selector.md
[css-selector]: ../CSS%20selector.md
