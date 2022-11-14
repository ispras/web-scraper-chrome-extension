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
		this.setAxiosInterceptors();
	}

	setAxiosInterceptors() {
		this.axiosInstance.interceptors.response.use(response => {
			const [contentType] = response.headers['content-type'].split(';');
			if (contentType !== 'application/json') {
				const error = new Error(`Incorrect response type`);
				return Promise.reject(error);
			}
			return response;
		});
	}

	createSitemap(sitemap) {
		return this._createSitemap(sitemap, this.sitemapsPath);
	}

	_createSitemap(sitemap, sitemapsPath) {
		return this.axiosInstance
			.post(sitemapsPath, Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(response => Sitemap.sitemapFromObj(response.data))
			.catch(error => {
				alert(`StoreApi: Error creating sitemap. ${error}`);
			});
	}

	async saveSitemap(sitemap, previousSitemapId) {
		const sitemapId = previousSitemapId || sitemap._id;
		const sitemapExists = await this.sitemapExists(sitemapId);
		return this._saveSitemap(
			sitemap,
			sitemapId,
			previousSitemapId,
			this.sitemapsPath,
			sitemapExists
		);
	}

	async _saveSitemap(sitemap, sitemapId, previousSitemapId, sitemapsPath, sitemapExists) {
		if (!sitemapExists) {
			return this.createSitemap(sitemap);
		}

		const result = await this.axiosInstance
			.put(urlJoin(sitemapsPath, sitemapId), Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(() => {
				return sitemap;
			})
			.catch(error => {
				if (error.response && error.response.status === 304) {
					return sitemap;
				}
				alert(`StoreApi: Error updating sitemap. ${error}`);
			});

		if (result && previousSitemapId && previousSitemapId !== sitemap._id) {
			await this.localDataStore.moveSitemapData(previousSitemapId, sitemap._id);
		}
		return result;
	}

	deleteSitemap(sitemap) {
		return this._deleteSitemap(sitemap, this.sitemapsPath);
	}

	async _deleteSitemap(sitemap, sitemapsPath) {
		const result = await this.axiosInstance
			.delete(urlJoin(sitemapsPath, sitemap._id))
			.then(response => {
				return response.data;
			})
			.catch(error => {
				alert(`StoreApi: Error deleting sitemap. ${error}`);
			});
		if (result) {
			await this.localDataStore.getSitemapDataDb(sitemap._id).destroy();
		}
		return result;
	}

	getAllSitemaps() {
		return this._getAllSitemaps(this.sitemapsPath);
	}

	_getAllSitemaps(sitemapsPath) {
		return this.axiosInstance
			.get(sitemapsPath)
			.then(response => {
				const failedIds = [];
				const sitemaps = Array.from(response.data, sitemapObj => {
					try {
						return Sitemap.sitemapFromObj(sitemapObj);
					} catch (error) {
						console.error('Failed to read sitemap', sitemapObj, error);
						failedIds.push(sitemapObj._id);
					}
				}).filter(Boolean);

				if (failedIds.length) {
					alert(`StoreApi: failed to read sitemaps ${failedIds.join(', ')}`);
				}
				return sitemaps;
			})
			.catch(error => {
				alert(`StoreApi: Could not get all sitemaps. ${error}`);
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
