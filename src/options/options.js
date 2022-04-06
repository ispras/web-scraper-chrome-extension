import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import * as browser from 'webextension-polyfill';
import * as $ from 'jquery';
import Config from '../scripts/Config';
import Translator from '../scripts/Translator';
import axios from 'axios';

// Extension configuration
const config = new Config();

browser.runtime.onMessage.addListener(async request => {
	if (request.talismanAuth) {
		console.log('browser.runtime.onMessage', request);
		if (request.talismanAuth.success) {
			$('.alert')
				.attr('id', 'success')
				.text(Translator.getTranslationByKey('options_auth_successful'))
				.show();
			Translator.translatePage();
		} else if (!request.talismanAuth.success) {
			$('.alert')
				.attr('id', 'error')
				.text(
					Translator.getTranslationByKey('options_auth_error_updating') +
						request.talismanAuth.message
				)
				.show();
			Translator.translatePage();
		}
	}
	checkTLogin();
});

function initPopups() {
	// popups for Storage setting input fields
	$('body').on('click', '.password-checkbox', function () {
		if ($(this).is(':checked')) {
			$('#talismanUserPassword').attr('type', 'text');
		} else {
			$('#talismanUserPassword').attr('type', 'password');
		}
	});

	$('#sitemapDb')
		.popover({
			title: Translator.getTranslationByKey('options_couchdb_db_popup_title'),
			html: true,
			content: `${Translator.getTranslationByKey(
				'options_couchdb_db_popup_content'
			)} <br /> http://example.com/scraper-sitemaps/`,
			placement: 'bottom',
		})
		.blur(function () {
			$(this).popover('hide');
		});

	$('#dataDb')
		.popover({
			title: Translator.getTranslationByKey('options_couchdb_datadb_popup_title'),
			html: true,
			content: `${Translator.getTranslationByKey(
				'options_couchdb_datadb_popup_content'
			)} <br />http://example.com/`,
			placement: 'bottom',
		})
		.blur(function () {
			$(this).popover('hide');
		});

	$('#restUrl')
		.popover({
			title: Translator.getTranslationByKey('options_rest_url_popup_title'),
			html: true,
			content: Translator.getTranslationByKey('options_rest_url_popup_content'),
			placement: 'bottom',
		})
		.blur(function () {
			$(this).popover('hide');
		});

	$('#talismanApiURL')
		.popover({
			title: Translator.getTranslationByKey('options_talisman_url_popup_title'),
			html: true,
			content: Translator.getTranslationByKey('options_talisman_url_popup_content'),
			placement: 'bottom',
		})
		.blur(function () {
			$(this).popover('hide');
		});
}

function initConfigSwitch() {
	// switch between configuration types
	$('select[name=storageType]').change(function () {
		const type = $(this).val();
		if (type === 'couchdb') {
			$('.alert').hide();
			$('.form-group.couchdb').show();
			$('.form-group.rest').hide();
			$('.form-group.talisman').hide();
		} else if (type === 'rest') {
			$('.alert').hide();
			$('.form-group.rest').show();
			$('.form-group.couchdb').hide();
			$('.form-group.talisman').hide();
		} else if (type === 'talisman') {
			$('.alert').hide();
			$('.form-group.rest').hide();
			$('.form-group.couchdb').hide();
			$('.form-group.talisman').show();
		} else {
			$('.alert').hide();
			$('.form-group.rest').hide();
			$('.form-group.couchdb').hide();
			$('.form-group.talisman').hide();
		}
	});
}

function initConfig() {
	// load previously synced data
	config.loadConfiguration().then(async () => {
		$('#storageType').val(config.storageType);
		$('#sitemapDb').val(config.sitemapDb);
		$('#dataDb').val(config.dataDb);
		$('#restUrl').val(config.restUrl);
		$('#talismanApiURL').val(config.talismanApiUrl);
		$('#talismanUserLogin').val(config.credential.username);
		$('#talismanUserPassword').val(config.credential.password);
		$('#options_talisman_check_auth').val(
			await function () {
				axios({
					method: 'get',
					url: `${config.talismanApiUrl}/oauth/token`,
				}).then(response => {
					if (response.data.preferred_username) {
						$('#options_talisman_check_auth').val(
							`Authorized by: ${response.data.preferred_username}`
						);
					} else {
						$('#options_talisman_check_auth').val('Not authorized');
					}
				});
			}
		);
		$('select[name=storageType]').change();
		if (browser.i18n.getUILanguage() === 'ru' && config.storageType !== 'couchdb') {
			$('#storageType [value=couchdb]').hide();
		}
	});
	return false;
}

function initFormSubmit() {
	// Sync storage settings
	$('#options_talisman_check_auth_button').click(() => {
		checkTLogin();
	});
	$('form#storage_configuration').submit(() => {
		const storageType = $('#storageType').val();
		const newConfig = {
			storageType,
			sitemapDb: '',
			dataDb: '',
			restUrl: '',
			talismanApiUrl: '',
			credential: '',
			timestamp: Date.now(),
		};

		if (storageType === 'couchdb') {
			newConfig.sitemapDb = $('#sitemapDb').val();
			newConfig.dataDb = $('#dataDb').val();
		} else if (storageType === 'rest') {
			newConfig.restUrl = $('#restUrl').val();
		} else if (storageType === 'talisman') {
			newConfig.talismanApiUrl = $('#talismanApiURL').val();
			const tLogin = $('#talismanUserLogin').val();
			const tPassword = $('#talismanUserPassword').val();
			newConfig.credential = { username: tLogin, password: tPassword };
		}
		config.updateConfiguration(newConfig).then(r => console.log(r));
		return false;
	});
}

function checkTLogin() {
	const storageType = $('#storageType').val();
	let tUrl = $('#talismanApiURL').val();
	try {
		tUrl = new URL(tUrl).origin;
	} catch (err) {
		tUrl = 'PLEASE ENTER URL';
	}
	if (tUrl !== 'PLEASE ENTER URL') {
		if (storageType === 'talisman') {
			axios({
				method: 'get',
				url: `${tUrl}/oauth/token`,
			})
				.then(response => {
					if (response.data.preferred_username) {
						$('#options_talisman_check_auth').text(
							`Authorized by: ${response.data.preferred_username}`
						);
					} else {
						$('#options_talisman_check_auth').text('Not authorized');
					}
				})
				.catch(er => {
					$('.alert').attr('id', 'error').text(er).show();
				});
		} else {
			return 'Something wrong';
		}
	} else {
		alert(tUrl);
		return false;
	}
}

function logOut() {
	$('#options_talisman_log_out_button').click(async (url, config) => {
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
	});

	function handleResponse(message) {
		console.log(`Message from the background script:  ${message.response}`);
	}

	function handleError(error) {
		console.log(`Error: ${error}`);
	}
}

$(() => {
	initPopups();
	initConfigSwitch();
	initConfig();
	initFormSubmit();
	logOut();
	Translator.translatePage();
});
