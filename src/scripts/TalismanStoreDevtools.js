import * as browser from 'webextension-polyfill';
import StoreDevtools from './StoreDevtools';
import Sitemap from './Sitemap';

export default class TalismanStoreDevtools extends StoreDevtools {
	constructor(storageType) {
		super(storageType);
		this.supportAuth = true;
	}

	async isAuthorized() {
		const request = {
			isAuthorized: true,
		};
		return await browser.runtime.sendMessage(request);
	}

	async authorize(credential) {
		const request = {
			login: true,
			credential: credential,
		};
		return await browser.runtime.sendMessage(request);
	}

	async logOut() {
		const request = {
			logOut: true,
		};
		return await browser.runtime.sendMessage(request);
	}

	async getAllSitemaps(projectId) {
		const request = {
			getAllSitemaps: true,
			projectId: projectId,
		};
		return this._getAllSitemapsResponseHandler(await browser.runtime.sendMessage(request));
	}

	async getAllProjects() {
		const request = {
			getAllProjects: true,
		};
		return await browser.runtime.sendMessage(request);
	}

	sitemapExists(sitemapId, projectId) {
		const request = {
			sitemapExists: true,
			sitemapId,
			projectId,
		};
		return browser.runtime.sendMessage(request);
	}

	async createSitemap(sitemap, projectId) {
		const request = {
			createSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			projectId,
		};

		return Sitemap.sitemapFromObj(await browser.runtime.sendMessage(request));
	}

	async saveSitemap(sitemap, previousSitemapId, projectId) {
		const request = {
			saveSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			previousSitemapId,
			projectId,
		};

		const newSitemap = await browser.runtime.sendMessage(request);
		sitemap._rev = newSitemap._rev;
		return sitemap;
	}

	deleteSitemap(sitemap, projectId) {
		const request = {
			deleteSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			projectId,
		};
		return browser.runtime.sendMessage(request);
	}

	async getStandName() {
		const request = {
			getStandName: true,
		};
		return await browser.runtime.sendMessage(request);
	}
}
