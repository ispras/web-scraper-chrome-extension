import * as browser from "webextension-polyfill";

const VERSION_REQUEST = "get Web Scraper Extension version";
const VERSION_RESPONSE = "Web Scraper Extension version";

export default function init() {
  document.addEventListener(VERSION_REQUEST, () => {
    document.dispatchEvent(
      new CustomEvent(VERSION_RESPONSE, {
        detail: browser.runtime.getManifest().version
      })
    );
  });
}
