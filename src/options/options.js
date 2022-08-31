import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import * as browser from 'webextension-polyfill';
import * as $ from 'jquery';
import Config from '../scripts/Config';
import Translator from '../scripts/Translator';

// Extension configuration
const config = new Config();

function initPopups() {
	// popups for Storage setting input fields
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
	const couchDbOptionsMenu = $('.form-group.couchdb');
	const restOptionsMenu = $('.form-group.rest');
	const talismanOptionsMenu = $('.form-group.talisman');
	$('select[name=storageType]').change(function () {
		couchDbOptionsMenu.hide();
		restOptionsMenu.hide();
		talismanOptionsMenu.hide();
		const type = $(this).val();
		if (type === 'couchdb') {
			couchDbOptionsMenu.show();
		} else if (type === 'rest') {
			restOptionsMenu.show();
		} else if (type === 'talisman') {
			talismanOptionsMenu.show();
		}
	});
}

function initConfig() {
	// load previously synced data
	config.loadConfiguration().then(() => {
		$('#storageType').val(config.storageType);
		$('#sitemapDb').val(config.sitemapDb);
		$('#dataDb').val(config.dataDb);
		$('#restUrl').val(config.restUrl);
		$('#talismanApiURL').val(config.talismanApiUrl);
		$('select[name=storageType]').change();
		if (browser.i18n.getUILanguage() === 'ru' && config.storageType !== 'couchdb') {
			$('#storageType [value=couchdb]').hide();
		}
	});
}

function initFormSubmit() {
	// Sync storage settings
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
		}
		config
			.updateConfiguration(newConfig)
			.then(() => {
				$('.alert')
					.attr('id', 'success')
					.text(Translator.getTranslationByKey('options_successfully_updated'))
					.show();
				Translator.translatePage();
			})
			.catch(error => {
				console.error(error);
				$('.alert')
					.attr('id', 'error')
					.text(Translator.getTranslationByKey('options_error_updating'))
					.show();
			});
		return false;
	});
}

$(() => {
	initPopups();
	initConfigSwitch();
	initConfig();
	initFormSubmit();
	Translator.translatePage();
});
