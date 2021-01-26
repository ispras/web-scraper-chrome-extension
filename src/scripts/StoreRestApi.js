import axios from 'axios';
import Sitemap from './Sitemap';
import StorePouchDB from './StorePouchDB';

export default class StoreRestApi {
	constructor(config) {
		this.localDataStore = new StorePouchDB(config);
		this.axiosInstance = axios.create({
			baseURL: config.restUrl,
		});
		this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json';
		this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json';
	}

	createSitemap(sitemap) {
		return this.axiosInstance
			.post('/sitemaps/', Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(response => {
				if (response.hasOwnProperty('data') && response.data.hasOwnProperty('body')) {
					return Sitemap.sitemapFromObj(response.data.body);
				} else {
					return sitemap;
				}
			})
			.catch(() => {
				alert('StoreApi: Error creating sitemap.');
			});
	}

	async saveSitemap(sitemap) {
		const sitemapExists = await this.sitemapExists(sitemap._id);
		if (sitemapExists) {
			return this.axiosInstance
				.put(`/sitemaps/${sitemap._id}`, Sitemap.sitemapFromObj(sitemap).exportSitemap())
				.then(() => {
					return sitemap;
				})
				.catch(response => {
					if (response.statusCode() === 304) {
						return sitemap;
					}
					alert('StoreApi: Error updating sitemap.');
				});
		}
		return this.createSitemap(sitemap);
	}

	deleteSitemap(sitemap) {
		return this.axiosInstance
			.delete(`/sitemaps/${sitemap._id}`)
			.then(response => {
				return response.data;
			})
			.catch(() => {
				alert('StoreApi: Error deleting sitemap.');
			});
	}

	getAllSitemaps() {
		return this.axiosInstance
			.get('/sitemaps/')
			.then(response => {
				return Array.from(response.data, sitemapObj => {
					return Sitemap.sitemapFromObj(sitemapObj);
				});
			})
			.catch(() => {
				alert('StoreApi: Could not get all sitemaps.');
			});
	}

	async sitemapExists(sitemapId) {
		const sitemaps = await this.getAllSitemaps().catch(() => {
			alert('StoreApi: Error checking sitemap exists.');
		});
		return sitemaps.some(sitemap => sitemap._id === sitemapId);
	}

	initSitemapDataDb(sitemapId) {
		return this.localDataStore.initSitemapDataDb(sitemapId);
	}

	getSitemapData(sitemap) {
		return this.localDataStore.getSitemapData(sitemap);
	}
}
