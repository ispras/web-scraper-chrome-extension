import axios from 'axios';
import Sitemap from './Sitemap';
import StorePouchDB from './StorePouchDB';
import urlJoin from 'url-join';

export default class StoreRestApi {
	constructor(config, baseUrl, sitemapsPath = 'sitemaps/') {
		this.localDataStore = new StorePouchDB(config);
		this.axiosInstance = axios.create({
			baseURL: baseUrl,
		});
		this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json';
		this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json';
		this.sitemapsPath = sitemapsPath;
	}

	postInit() {
		this.axiosInstance.interceptors.response.use(response => {
			const contentType = response.headers['content-type'];
			if (contentType !== 'application/json') {
				const error = new Error(`Expected JSON response from API, but got ${contentType}`);
				return Promise.reject(error);
			}
			return response;
		});
	}

	createSitemap(sitemap) {
		return this.axiosInstance
			.post(this.sitemapsPath, Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(response => Sitemap.sitemapFromObj(response.data))
			.catch(() => {
				alert('StoreApi: Error creating sitemap.');
			});
	}

	async saveSitemap(sitemap) {
		const sitemapExists = await this.sitemapExists(sitemap._id);
		if (sitemapExists) {
			return this.axiosInstance
				.put(
					urlJoin(this.sitemapsPath, sitemap._id),
					Sitemap.sitemapFromObj(sitemap).exportSitemap()
				)
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
			.delete(urlJoin(this.sitemapsPath, sitemap._id))
			.then(response => {
				return response.data;
			})
			.catch(() => {
				alert('StoreApi: Error deleting sitemap.');
			});
	}

	getAllSitemaps() {
		return this.axiosInstance
			.get(this.sitemapsPath)
			.then(response => {
				const sitemaps = [];
				const failedIds = [];
				response.data.forEach(sitemapObj => {
					try {
						sitemaps.push(Sitemap.sitemapFromObj(sitemapObj));
					} catch (error) {
						console.error('Failed to read sitemap', sitemapObj, error);
						failedIds.push(sitemapObj._id);
					}
				});
				if (failedIds.length) {
					alert(`StoreApi: failed to read sitemaps ${failedIds.join(', ')}`);
				}
				return sitemaps;
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
