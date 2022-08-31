import * as browser from 'webextension-polyfill';
import Sitemap from './Sitemap';

/**
 * From devtools panel there is no possibility to execute XHR requests. So all requests to a remote CouchDb must be
 * handled through Background page. StoreDevtools is a simply a proxy store
 * @constructor
 */
export default class StoreDevtools {
	constructor(storageType) {
		this.storageType = storageType;
		this.supportAuth = false;
	}

	async createSitemap(sitemap) {
		const request = {
			createSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		return Sitemap.sitemapFromObj(await browser.runtime.sendMessage(request));
	}

	async saveSitemap(sitemap) {
		const request = {
			saveSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		const newSitemap = await browser.runtime.sendMessage(request);
		sitemap._rev = newSitemap._rev;
		return sitemap;
	}

	deleteSitemap(sitemap) {
		const request = {
			deleteSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};
		return browser.runtime.sendMessage(request);
	}

	async getAllSitemaps() {
		const request = {
			getAllSitemaps: true,
		};
		const response = await browser.runtime.sendMessage(request);

		if (response.error_msg) {
			return response;
		}
		return Array.from(response, sitemapObj => {
			try {
				return Sitemap.sitemapFromObj(sitemapObj);
			} catch (error) {
				console.error('Failed to read sitemap', sitemapObj, error);
				return null;
			}
		}).filter(Boolean);
	}

	getSitemapData(sitemap) {
		const request = {
			getSitemapData: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		return browser.runtime.sendMessage(request);
	}

	sitemapExists(sitemapId) {
		const request = {
			sitemapExists: true,
			sitemapId,
		};

		return browser.runtime.sendMessage(request);
	}
}
