import * as browser from 'webextension-polyfill';

//Tip from https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
let isFirefox = typeof InstallTrigger !== 'undefined';

if (isFirefox) {
	browser.devtools.panels.create('Web Scraper', '../icons/icon48.png', './panel.html');
} else {
	browser.devtools.panels.create('Web Scraper', 'icons/icon48.png', 'devtools/panel.html');
}
