import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import * as browser from 'webextension-polyfill';
import * as $ from 'jquery';
import Config from '../scripts/Config';
import Translator from '../scripts/Translator';
import axios from 'axios';

// Extension configuration
const config = new Config();
config.loadConfiguration().then(r => null);

export async function checkTLogin() {
	let tUrl = config.talismanApiUrl;
	try {
		tUrl = new URL(tUrl).origin;
	} catch (err) {
		alert(err);
		return err;
	}
	let response = await axios({
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

export function authorizationFormInit() {
	$('#talismanUserLogin').val(config.credential.username);
	// Sync storage settings
	$('body').on('click', '.password-checkbox', function () {
		if ($(this).is(':checked')) {
			$('#talismanUserPassword').attr('type', 'text');
		} else {
			$('#talismanUserPassword').attr('type', 'password');
		}
	});
}

export async function tAuthFormSubmit() {
	const request = {
		talismanLogin: true,
		credential: {
			username: $('#talismanUserLogin').val(),
			password: $('#talismanUserPassword').val(),
		},
	};

	const authStatus = await browser.runtime.sendMessage(request);

	if (authStatus.talismanAuth.success) {
		return authStatus.talismanAuth.username;
	} else if (!authStatus.talismanAuth.success) {
		$('.alert')
			.attr('id', 'error')
			.text(
				Translator.getTranslationByKey('options_auth_error_updating') +
					authStatus.talismanAuth.message
			)
			.show();
		Translator.translatePage();
	}
}

export async function tLogOut() {
	await browser.runtime.sendMessage({ logOut: { url: config.talismanApiUrl } });
}
