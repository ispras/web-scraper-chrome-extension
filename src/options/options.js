import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import Config from '../scripts/Config';
import * as browser from 'webextension-polyfill';
import Translator from '../scripts/Translator';

function initPopups() {
	// popups for Storage setting input fields
	$('#sitemapDb')
		.popover({
			title: Translator.translateElement('options-database-sitemap-title'),
			html: true,
			content: Translator.translateElement('options-couchDB-url') + ' <br /> http://example.com/scraper-sitemaps/',
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#dataDb')
		.popover({
			title: Translator.translateElement('options-database-scraped-data-title'),
			html: true,
			content: Translator.translateElement('options-couchdb-database-url'),
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#restUrl')
		.popover({
			title: Translator.translateElement('options-url-to-push'),
			html: true,
			content: Translator.translateElement('options-rest-api-url'),
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});
}

function initConfigSwitch() {
	// switch between configuration types
	$('select[name=storageType]').change(function() {
		let type = $(this).val();
		if (type === 'couchdb') {
			$('.form-group.couchdb').show();
			$('.form-group.rest').hide();
		} else if (type === 'rest') {
			$('.form-group.rest').show();
			$('.form-group.couchdb').hide();
		} else {
			$('.form-group.rest').hide();
			$('.form-group.couchdb').hide();
		}
	});
}

function initConfig() {
	// load previously synced data
	config.loadConfiguration().then(() => {
		$('#locale').val(config.locale);
		$('#storageType').val(config.storageType);
		$('#sitemapDb').val(config.sitemapDb);
		$('#dataDb').val(config.dataDb);
		$('#restUrl').val(config.restUrl);

		$('select[name=storageType]').change();
	});
}

function initFormSubmit() {
	// Sync storage settings
	$('form#storage_configuration').submit(() => {
		const storageType = $('#storageType').val();
		const locale = $('#locale').val();
		const newConfig = {
			storageType: storageType,
			sitemapDb: '',
			dataDb: '',
			restUrl: '',
			locale: locale,
		};

		if (storageType === 'couchdb') {
			newConfig.sitemapDb = $('#sitemapDb').val();
			newConfig.dataDb = $('#dataDb').val();
		} else if (storageType === 'rest') {
			newConfig.restUrl = $('#restUrl').val();
		}

		config
			.updateConfiguration(newConfig)
			.then(() => {
				$('.alert')
					.attr('id', 'success')
					.text(Translator.translateElement('options-successfully-updated'))
					.show();
				Translator.translateElement({
					locale: newConfig.locale,
				});
				Translator.translatePage();
			})
			.catch(() => {
				$('.alert')
					.attr('id', 'error')
					.text(Translator.translateElement('options-error-updating') + chrome.runtime.lastError.message)
					.show();
			});

		return false;
	});
}

// Extension configuration
let config = new Config();

$(() => {
	browser.runtime.sendMessage({ getLocale: true }).then(locale => {
		Translator.initLocal(locale);
		Translator.translateElement()
			.load(Translator.localePath())
			.promise()
			.then(() => {
				initPopups();
				initConfig();
				initConfigSwitch();
				initFormSubmit();
				Translator.translatePage();
			});
	});
});
