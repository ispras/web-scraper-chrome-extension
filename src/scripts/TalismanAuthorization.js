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
	$('form#talisman_auth_form').submit(function () {
		const tLogin = $('#talismanUserLogin').val();
		const tPassword = $('#talismanUserPassword').val();
		const request = {
			talismanLogin: true,
			credential: { username: tLogin, password: tPassword },
		};
		browser.runtime.sendMessage(request).then(msg => {
			console.log('browser.runtime.onMessage', msg);
			if (msg.talismanAuth.success) {
				$('.alert')
					.attr('id', 'success')
					.text(Translator.getTranslationByKey('options_auth_successful'))
					.show();
				Translator.translatePage();
			} else if (!msg.talismanAuth.success) {
				$('.alert')
					.attr('id', 'error')
					.text(
						Translator.getTranslationByKey('options_auth_error_updating') +
							msg.talismanAuth.message
					)
					.show();
				Translator.translatePage();
			}
		});
		return true;
	});
}

export async function logOut() {
	let tUrl = $('#talismanApiURL').val();
	try {
		tUrl = new URL(tUrl).origin;
	} catch (err) {
		tUrl = 'PLEASE ENTER URL';
	}
	let response = await axios({
		method: 'get',
		url: `${tUrl}/oauth/token`,
	});
	if (response.data.preferred_username) {
		browser.runtime
			.sendMessage({ logOut: { url: tUrl } })
			.then(handleResponse, handleError)
			.finally(() => {
				checkTLogin();
				$('.alert')
					.attr('id', 'success')
					.text(Translator.getTranslationByKey('options_logout_successful'))
					.show();
			});
	} else {
		$('.alert').attr('id', 'error').text('You are not in system').show();
	}

	function handleResponse(message) {
		console.log(`Message from the background script:  ${message.response}`);
	}

	function handleError(error) {
		console.log(`Error: ${error}`);
	}
}
