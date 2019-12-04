# SelectorDocument
Document selector can extract attribute (URL) of a document. 
Optionally you can also store the document. The document will be stored in your
downloads directory.

Note! Document selector works only with `<a>` tags with `href` attribute.If the
download selector is not working for you then you can look at Link selector.

## Configuration options
 * selector - [CSS selector] [css-selector] for the document element.
 * multiple - multiple records are being extracted.
 * Download document - downloads and store document on local drive. When CouchDB
 storage back end is used the document is also stored locally.
 * delay - delay the extraction


