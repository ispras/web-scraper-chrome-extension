import Sitemap from './Sitemap';
import * as browser from 'webextension-polyfill';

/**
 * From devtools panel there is no possibility to execute XHR requests. So all requests to a remote CouchDb must be
 * handled through Background page. StoreDevtools is a simply a proxy store
 * @constructor
 */
export default class StoreDevtools {

	async createSitemap(sitemap) {
		let request = {
			createSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		let newSitemap = await browser.runtime.sendMessage(request);
		sitemap._rev = newSitemap._rev;
		return sitemap;
	}

	saveSitemap(sitemap) {
		return this.createSitemap(sitemap);
	}

	deleteSitemap(sitemap) {
		let request = {
			deleteSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};
		return browser.runtime.sendMessage(request);
	}

	async getAllSitemaps() {
		let request = {
			getAllSitemaps: true,
		};
		let response = await browser.runtime.sendMessage(request);
		return Array.from(response, sitemapObj => {
			let sitemap = Sitemap.sitemapFromObj(sitemapObj);
			if (sitemapObj._rev){
				sitemap._rev = sitemapObj._rev;
			}
			return sitemap;
		});
	}

	getSitemapData(sitemap) {
		let request = {
			getSitemapData: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		return browser.runtime.sendMessage(request);
	}

	sitemapExists(sitemapId) {
		let request = {
			sitemapExists: true,
			sitemapId: sitemapId,
		};

		return browser.runtime.sendMessage(request);
	}
}
