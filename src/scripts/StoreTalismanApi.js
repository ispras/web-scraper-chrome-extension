import axios from 'axios';
import Sitemap from './Sitemap';
import StorePouchDB from './StorePouchDB';
import * as $ from 'jquery';
import { authorizationFormInit, checkTLogin } from './TalismanAuthorization';
import Translator from './Translator';

export default class StoreTalismanApi {
	constructor(config) {
		this.localDataStore = new StorePouchDB(config);
		this.axiosInstance = axios.create({
			baseURL: config.talismanApiUrl,
		});
	}

	async initTalismanLogin(credentials) {
		let bodyForm = new FormData();
		let tLogin = credentials.username;
		let tPassword = credentials.password;
		bodyForm.append('username', tLogin);
		bodyForm.append('password', tPassword);
		return await this.axiosInstance.post(
			this.axiosInstance.defaults.baseURL + '/oauth/login',
			bodyForm,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
	}

	postInit(tToken) {
		this.axiosInstance.defaults.headers.post['Content-Type'] = 'application/json';
		this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json';
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
			.get('/api/sitemaps/')
			.then(response => {
				if (response.headers['content-type'] !== 'application/json') {
					return { error_msg: 'error' };
				}
				return Array.from(response.data, sitemapObj => {
					return Sitemap.sitemapFromObj(sitemapObj);
				});
			})
			.catch(err => {
				alert('StoreApi: Could not get all sitemaps.' + err);
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
