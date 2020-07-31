# Development Instructions

## Selector Development

This section demonstrates all steps that are needed in order to create or extend a selector for the web scraper. In this example we are creating a "Select All" selector.

### Create Selector Logic

You can skip the file creation steps if you intend to extend other selectors with functionallity.

-   Duplicate the file `SelectorElementStyle.js` in `scripts/Selector/`
-   Rename the duplicated file to `SelectorAll.js`
-   Modify the `getData` method to return all content
-   Specify which features you like to have enabled in the `getFeatures` function
-   Implement the logic for the enabled features (Feature `textmanipulation` will work out of the box)

### Create Selector Controls

-   Add a section into the `SelectorEdit.html` file in `devtools/views/`
-   Add section class `form-group feature feature-AllSelector`
-   You can use `{{#selectorName}}` and `{{/selectorName}}` to prevent content from displaying (used for checkobx controls)
-   Use `{{selector.selectorAll}}` to define a variable

### Set references to your selector

#### Controler

-   Open the `Controler.js` in `scripts/`
-   Add a variable in the function `getCurrentlyEditedSelector` to select your HTML section value
-   Add the variable to the `newSelector` object (every selector in `scripts/Selector/` that references this feature can access the value)
-   Add validation rules to your variable in the function `initSelectorValidation`

#### File reference

-   Add a reference in `extension/manifest.json` in the section `content_scripts` and `scripts`
-   Add a reference to `extension\devtools\devtools_scraper_panel.html`
-   Add a eference to `playgrounds\extension\index.html`
-   Add a reference to `tests\SpecRunner.html`

### Testing

For testing you need to run a web server. Personally I use [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) and reference the working directory of the project.

-   Duplicate a test file in `tests/Selector` and rename it
-   Write your tests for your selector
-   Run the tests by opening `tests/SpecRunner.html`
-   Try you implementation by opening `playgrounds/extension/index.html`
-   Extend the playground if it does not cover your scenario

### Documentation

-   Create a `md` file in `docs/selectors`
-   Describe the usage, options, etc
