# Installation

## Requirements

The extension supports different browsers at least Chrome and Mozilla Firefox. Opera is also possible browser fo use.

# Install Chrome

To install the program, you must perform the following actions:

1. Unzip the file with the plugin "web-scraper-chrome-extension-v <version number> .zip" downloaded from [release page][latest-realease].

2. Go to the extensions page in the Google Chrome browser - [chrome://extensions/](chrome://extensions/)
   (Fig. Installing the program in the Google Chrome browser).

3. Enable developer mode using the switch in the upper right corner (if not enabled). (You can read more here https://developer.chrome.com/extensions/getstarted#unpacked).

You can add an extension to the browser in the following ways:

4a. Using the drag and drop system, move the folder `web-scraper-chrome-extension-v<version number>` obtained from the unzipped file to the extensions page;

4b. Download the unpacked extension from the folder `web-scraper-chrome-extension-v<version number> 'obtained from the unzipped file. As a result of the actions performed, a new Web Scraper extension should appear in the list of Google Chrome browser extensions:

![Fig. Installing the program in Google Chrome][install-chrome]

5. For the extension to work correctly, after installing it, restart chrome so that the extension works properly.

# Install Mozilla Firefox

To install the program, you must perform the following actions:

1. Go to the Mozilla Firefox browser settings page. about: config (Fig. Modifying Mozilla Firefox configuration).
2. In the search bar, enter the xpinstall.signatures.required setting and press Enter.
3. Set the value of this setting to false (double-click on the settings line).

![Fig. Modifying Mozilla Firefox][change-config]

4. Go to the add-ons page (extensions) of the Mozilla Firefox browser. about: addons
5. Open the settings menu by clicking on the corresponding icon (Fig. Installing add-ons).
6. Select the menu item "install add-on from file" in the drop-down list.

![Fig. Install Add-on][install-addon]

7. Select the file with the plugin "web-scraper-chrome-extension-v <version number> .zip" provided on the disk with the distribution package of the program.
8. Click on the file selection confirmation button (Fig. Selecting a file with the distribution package of the program).

![Fig. Selecting a program distribution file][choose-addon-file]

9. Confirm the installation of the extension in the pop-up window (Fig. Confirming the installation of the extension).

![Fig. Confirm install extension][confirm-install]

[install-chrome]: images/installation/Chrome_scraper_1.png
[change-config]: images/installation/Firefox_scraper_1.png
[install-addon]: images/installation/Firefox_scraper_2.png
[choose-addon-file]: images/installation/Firefox_scraper_3.png
[confirm-install]: images/installation/Firefox_scraper_4.png
[latest-releases]: https://github.com/ispras/web-scraper-chrome-extension/releases
