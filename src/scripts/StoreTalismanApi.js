import axios from 'axios';
import StoreRestApi from './StoreRestApi';
import urlJoin from 'url-join';
import * as browser from 'webextension-polyfill';

export default class StoreTalismanApi extends StoreRestApi {
	constructor(config, baseUrl) {
		const sitemapsPath = urlJoin('api', 'sitemaps/');
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
}
