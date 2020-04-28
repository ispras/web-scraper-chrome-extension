# Web Scraper

Web Scraper is a chrome browser extension built for data extraction from web
pages. Using this extension you can create a plan (sitemap) how a web site
should be traversed and what should be extracted. Using these sitemaps the
Web Scraper will navigate the site accordingly and extract all data. Scraped
data later can be exported as CSV or JSON Lines.

#### Latest Version

Read about installation process on [installation page](./docs/Installation.md).

## Changelog

### v0.3.6

-   Updated support for Tables (update vertical tables support and added complex headers and data rows)
-   Added export and import sitemap from file
-   Added Russian translations and support of i18n that make possible to add every language translation
-   Added Rest Api CRUD storage for sitemaps
-   Moved to webpack bundler
-   Added id hints from predefined model
-   Added selectors for Constants and Documents
-   Refactored preview data and added search in scraped data
-   Refactored returned items model to JSON
-   Added saving in JSON lines

### v0.3

-   Enabled pasting of multiple start URLs (by [@jwillmer](https://github.com/jwillmer))
-   Added scraping of dynamic table columns (by [@jwillmer](https://github.com/jwillmer))
-   Added style extraction type (by [@jwillmer](https://github.com/jwillmer))
-   Added text manipulation (trim, replace, prefix, suffix, remove HTML) (by [@jwillmer](https://github.com/jwillmer))
-   Added image improvements to find images in div background (by [@jwillmer](https://github.com/jwillmer))
-   Added support for vertical tables (by [@jwillmer](https://github.com/jwillmer))
-   Added random delay function between requests (by [@Euphorbium](https://github.com/Euphorbium))
-   Start URL can now also be a local URL (by [@3flex](https://github.com/3flex))
-   Added CSV export options (by [@mohamnag](https://github.com/mohamnag))
-   Added Regex group for select (by [@RuneHL](https://github.com/RuneHL))
-   JSON export/import of settings (by [@haisi](https://github.com/haisi))
-   Added date and number pattern in URL (by [@codoff](https://github.com/codoff))
-   Added pagination selector limit (by [@codoff](https://github.com/codoff))
-   Improved CSV export (by [@haisi](https://github.com/haisi))
-   Added click limit option (by [@panna-ahmed](https://github.com/panna-ahmed))

### v0.2

-   Added Element click selector
-   Added Element scroll down selector
-   Added Link popup selector
-   Improved table selector to work with any html markup
-   Added Image download
-   Added keyboard shortcuts when selecting elements
-   Added configurable delay before using selector
-   Added configurable delay between page visiting
-   Added multiple start url configuration
-   Added form field validation
-   Fixed a lot of bugs

### v0.1.3

-   Added Table selector
-   Added HTML selector
-   Added HTML attribute selector
-   Added data preview
-   Added ranged start urls
-   Fixed bug which made selector tree not to show on some operating systems

#### Bugs

When submitting a bug please attach an exported sitemap if possible.

#### Development

Read the [Development Instructions](/docs/Development.md) before you start.

## License

LGPLv3

[chrome-store]: https://chrome.google.com/webstore/detail/web-scraper/jnhgnonknehpejjnehehllkliplmbmhn
[webscraper.io]: http://webscraper.io/
[google-groups]: https://groups.google.com/forum/#!forum/web-scraper
[github-issues]: https://github.com/martinsbalodis/web-scraper-chrome-extension/issues
[get-started-chrome]: https://developer.chrome.com/extensions/getstarted#unpacked
[latest-releases]: https://github.com/ispras/web-scraper-chrome-extension/releases
