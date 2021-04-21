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
		this.axiosInstance.interceptors.response.use(response => {
			const contentType = response.headers['content-type']
			if (contentType !== 'application/json') {
				const error = new Error(`Expected JSON response from API, but got ${contentType}`);
				return Promise.reject(error);
			}
			return response;
		});
	}

	createSitemap(sitemap) {
		return this.axiosInstance
			.post('/sitemaps/', Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(response => Sitemap.sitemapFromObj(response.data))
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
				.catch(error => {
					if (error.response && error.response.status === 304) {
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
