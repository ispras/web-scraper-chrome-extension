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

	async getAllProjects() {
		const request = {
			getAllProjects: true,
		};
		return await browser.runtime
			.sendMessage(request)
			.then(res => res.data.data.paginationProject.listProject);
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
}
