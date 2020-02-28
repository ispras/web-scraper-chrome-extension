import Sitemap from './Sitemap';
import StorePouchDB from './StorePouchDB';
import axios from 'axios';

export default class StoreRestApi {
	constructor(config) {
		this.localDataStore = new StorePouchDB(config);
		axios.defaults.baseURL = config.restUrl;
		axios.defaults.headers.post['Content-Type'] = 'application/json';
		axios.defaults.headers.put['Content-Type'] = 'application/json';
		axios.defaults.headers.delete['Content-Type'] = 'application/json';
	}

	createSitemap(sitemap) {
		return axios
			.post({
				url: '/sitemaps/',
				data: Sitemap.sitemapFromObj(sitemap).exportSitemap(),
			})
			.then(() => {
				return sitemap;
			})
			.catch(() => {
				alert('StoreApi: Error creating sitemap.');
			});
	}

	async saveSitemap(sitemap) {
		let sitemapExists = await this.sitemapExists(sitemap._id);
		if (sitemapExists) {
			return axios
				.put({
					url: '/sitemaps/' + sitemap._id,
					data: Sitemap.sitemapFromObj(sitemap).exportSitemap(),
				})
				.then(() => {
					return sitemap;
				})
				.catch(() => {
					alert('StoreApi: Error updating sitemap.');
				});
		} else {
			return this.saveSitemap(sitemap);
		}
	}

	deleteSitemap(sitemap) {
		return axios
			.delete('/sitemaps/' + sitemap._id)
			.then(response => {
				return response;
			})
			.catch(() => {
				alert('StoreApi: Error deleting sitemap.');
			});
	}

	getAllSitemaps(iterable) {
		return axios
			.get('/sitemaps/')
			.then(response => {
				return Array.from(response, sitemapObj => {
					return Sitemap.sitemapFromObj(sitemapObj);
				});
			})
			.catch(() => {
				alert('StoreApi: Error deleting sitemap.');
			});
	}

	async sitemapExists(sitemapId) {
		let sitemaps = await this.getAllSitemaps().catch(() => {
			alert('StoreApi: Could not get all sitemaps.');
		});
		for (let sitemap of sitemaps) {
			if (sitemap._id === sitemapId) {
				return true;
			}
		}
		return false;
	}

	initSitemapDataDb(sitemapId) {
		return this.localDataStore.initSitemapDataDb(sitemapId);
	}

	getSitemapData(sitemap) {
		return this.localDataStore.getSitemapData(sitemap);
	}
}
