import axios from 'axios';
import StoreRestApi from './StoreRestApi';
import urlJoin from 'url-join';
import Sitemap from './Sitemap';
import * as browser from 'webextension-polyfill';

export default class StoreTalismanApi extends StoreRestApi {
	constructor(config, baseUrl) {
		const sitemapsPath = urlJoin('api');
		super(config, baseUrl, sitemapsPath);
	}

	async initTalismanLogin(credentials) {
		const bodyForm = new FormData();
		const tLogin = credentials.username;
		const tPassword = credentials.password;
		bodyForm.append('username', tLogin);
		bodyForm.append('password', tPassword);
		const loginStatus = await this.axiosInstance
			.post(urlJoin(this.axiosInstance.defaults.baseURL, '/oauth/login'), bodyForm, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
			.catch(er => er);
		if (loginStatus.isAxiosError || loginStatus.data.access_token === undefined) {
			return {
				authStatus: {
					success: false,
					status: loginStatus.status,
					message: loginStatus.message,
				},
			};
		} else {
			const credential = { username: credentials.username };
			return {
				authStatus: {
					success: true,
					username: credentials.username,
					credential: credential,
				},
			};
		}
	}

	setSitemapPath(projectId = null, sitemapId = null) {
		this.sitemapsPath = 'api';
		if (projectId) {
			this.sitemapsPath = urlJoin(this.sitemapsPath, 'projects', projectId, 'sitemaps/');
		}
		if (sitemapId) {
			this.sitemapsPath = urlJoin(this.sitemapsPath, sitemapId, '/');
		}
	}

	setAxiosInterceptors() {
		this.axiosInstance.interceptors.response.use(response => {
			if (response.request.responseURL.includes('auth')) {
				browser.runtime.sendMessage({
					authError: true,
				});
				const error = new Error(`Authentication Error`);
				return Promise.reject(error);
			}
			return response;
		});
		super.setAxiosInterceptors();
	}

	async isAuthorized() {
		let tUrl = this.axiosInstance.defaults.baseURL;
		try {
			tUrl = new URL(tUrl).origin;
		} catch (err) {
			$('.alert').attr('id', 'error').text(err).show();
			return false;
		}
		const response = await axios({
			method: 'get',
			url: `${tUrl}/oauth/token`,
		});
		try {
			if (response.data.preferred_username) {
				return response.data;
			} else {
				return false;
			}
		} catch (er) {
			$('.alert').attr('id', 'error').text(er).show();
			return false;
		}
	}

	async logOut() {
		delete this.axiosInstance.defaults.headers.Authorization;
		await this.axiosInstance.get('/oauth/logout');
	}

	async getAllProjects() {
		this.setSitemapPath();
		const queryData = {
			query: GET_ALL_PROJECTS_QUERY,
			variables: {
				limit: 100,
				sortField: 'title',
				sortDirection: 'ascending',
			},
		};
		return this.axiosInstance.post('/graphql', queryData);
	}

	async getAllSitemaps(projectId) {
		if (!projectId) {
			projectId = this.sitemapsPath.split('/')[2];
		}
		this.setSitemapPath(projectId);
		const queryData = {
			query: GET_ALL_PROJECT_SITEMAPS_QUERY,
			variables: {
				filterSettings: {
					projects: [projectId],
					crawlersTypes: ['SitemapCrawlers'],
				},
				sortField: 'title',
				sortDirection: 'ascending',
			},
		};
		const sitemaps_obj = await this.axiosInstance.post('/graphql', queryData);
		return sitemaps_obj.data.data.paginationCrawler.listCrawler.map(sitemap =>
			JSON.parse(sitemap.sitemap)
		);
	}

	createSitemap(sitemap) {
		return this.axiosInstance
			.post(this.sitemapsPath, Sitemap.sitemapFromObj(sitemap).exportSitemap())
			.then(response => Sitemap.sitemapFromObj(response.data))
			.catch(er => {
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
}

const GET_ALL_PROJECTS_QUERY = `query getProjects($sortDirection: SortDirection $sortField: ProjectSorting $limit:Int) {
 					paginationProject(
 					  sortField: $sortField
 					  direction: $sortDirection
 					  limit: $limit ) {
							total
							listProject {
								id
								title
								name
								crawlersNum
							}
						}
				}`;

const GET_ALL_PROJECT_SITEMAPS_QUERY = `query getCrawlers($filterSettings: CrawlerFilterSettings, $sortDirection: SortDirection, $sortField: CrawlerSorting) {
          paginationCrawler(
            filterSettings: $filterSettings
            direction: $sortDirection
            sortField: $sortField
          ) {
            total
            listCrawler {
              id
              name
              title
              sitemap
            }
          }
        }`;
