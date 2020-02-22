import Sitemap from './Sitemap';
import * as browser from 'webextension-polyfill';

/**
 * From devtools panel there is no possibility to execute XHR requests. So all requests to a remote CouchDb must be
 * handled through Background page. StoreDevtools is a simply a proxy store
 * @constructor
 */
export default class StoreDevtools {
	createSitemap(sitemap) {
		var request = {
			createSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		return new Promise(resolve => {
			browser.runtime.sendMessage(request).then(
				function(originalSitemap, newSitemap) {
					originalSitemap._rev = newSitemap._rev;
					resolve(originalSitemap);
				}.bind(this, sitemap)
			);
		});
	}

	saveSitemap(sitemap) {
		return this.createSitemap(sitemap);
	}

	deleteSitemap(sitemap) {
		var request = {
			deleteSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};
		return browser.runtime.sendMessage(request);
	}

	getAllSitemaps() {
		var request = {
			getAllSitemaps: true,
		};

		return new Promise(resolve => {
			browser.runtime.sendMessage(request).then(function(response) {
				var sitemaps = [];

				for (var i in response) {
					sitemaps.push(new Sitemap(response[i]));
				}
				return resolve(sitemaps);
			});
		});
	}

	getSitemapData(sitemap) {
		var request = {
			getSitemapData: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
		};

		return browser.runtime.sendMessage(request);
	}

	sitemapExists(sitemapId) {
		var request = {
			sitemapExists: true,
			sitemapId: sitemapId,
		};

		return browser.runtime.sendMessage(request);
	}
}
