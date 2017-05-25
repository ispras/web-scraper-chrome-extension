# Element style selector
Element style selector can extract an style value of an HTML element.
For example you could use this selector to extract the with attribute from
this div: `<div style="width: 20px;"><div>`.

## Configuration options
 * selector - [CSS selector] [css-selector] for the element.
 * multiple - multiple records are being extracted.
 * style name - the attribute that is going to be extracted. For example
 `width`, `background-image`.
 * remove HTML
 * trim text
 * replace text - regular expression in the replace field possible
 * text prefix/suffix
 * delay - delay the extraction

## Use cases
See [Text selector] [text-selector] use cases.

 [text-selector]: Text%20selector.md
 [css-selector]: ../CSS%20selector.md