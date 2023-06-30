import axios from 'axios';
import StoreRestApi from './StoreRestApi';
import urlJoin from 'url-join';
import * as browser from 'webextension-polyfill';

const PROJECTS_LIMIT = 10000;
const SITEMAPS_IN_PROJECT_LIMIT = 10000;

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

export default class StoreTalismanApi extends StoreRestApi {
	constructor(config, baseUrl) {
		const sitemapsPath = urlJoin('api');
		super(config, baseUrl, sitemapsPath);
		this.sitemapsPathInProject = projectId => {
			return `${this.sitemapsPath}/projects/${projectId}/sitemaps/`;
		};
		this.standName = this.getStandName();
	}

	async getStandName() {
		const response = await axios({
			method: 'get',
			url: urlJoin(this.axiosInstance.defaults.baseURL, 'meta.json'),
		});
		return response.data.APP_NAME;
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
		const queryData = {
			query: GET_ALL_PROJECTS_QUERY,
			variables: {
				limit: PROJECTS_LIMIT,
				sortField: 'title',
				sortDirection: 'ascending',
			},
		};
		const projects = await this.axiosInstance.post('/graphql', queryData);
		return projects.data.data.paginationProject.listProject;
	}

	async getAllSitemaps(projectId) {
		return this._getAllSitemaps(
			`${this.sitemapsPathInProject(projectId)}?limit=${SITEMAPS_IN_PROJECT_LIMIT}`
		);
	}

	async sitemapExists(sitemapId, projectId) {
		const sitemaps = await this.getAllSitemaps(projectId).catch(() => {
			alert('StoreApi: Error checking sitemap exists.');
		});
		return sitemaps.some(sitemap => sitemap._id === sitemapId);
	}

	createSitemap(sitemap, projectId) {
		return this._createSitemap(sitemap, this.sitemapsPathInProject(projectId));
	}

	deleteSitemap(sitemap, projectId) {
		return this._deleteSitemap(sitemap, this.sitemapsPathInProject(projectId));
	}

	async saveSitemap(sitemap, previousSitemapId, projectId) {
		const sitemapId = previousSitemapId || sitemap._id;
		const sitemapExists = await this.sitemapExists(sitemapId, projectId);
		return this._saveSitemap(
			sitemap,
			sitemapId,
			previousSitemapId,
			this.sitemapsPathInProject(projectId),
			sitemapExists
		);
	}
}
