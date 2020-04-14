import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import Config from '../scripts/Config';
import * as browser from 'webextension-polyfill';

function fillLocale() {
	$('[data-i18n]').each(function() {
		let messageKey = $(this).attr('data-i18n');
		$(this).html($.i18n(messageKey));
	});
	$('[placeholder]').each(function() {
		let placeholderKey = $(this).attr('placeholder');
		$(this).attr('placeholder', $.i18n(placeholderKey));
	});
}

function initPopups() {
	// popups for Storage setting input fields
	$('#sitemapDb')
		.popover({
			title: $.i18n('options-database-sitemap-title'),
			html: true,
			content: $.i18n('options-couchDB-url') + ' <br /> http://example.com/scraper-sitemaps/',
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#dataDb')
		.popover({
			title: $.i18n('options-database-scraped-data-title'),
			html: true,
			content: $.i18n('options-couchdb-database-url'),
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#restUrl')
		.popover({
			title: $.i18n('options-url-to-push'),
			html: true,
			content: $.i18n('options-rest-api-url'),
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
					.text($.i18n('options-successfully-updated'))
					.show();
				$.i18n({
					locale: newConfig.locale,
				});
				fillLocale();
			})
			.catch(() => {
				$('.alert')
					.attr('id', 'error')
					.text($.i18n('options-error-updating') + chrome.runtime.lastError.message)
					.show();
			});

		return false;
	});
}

// Extension configuration
let config = new Config();

$(() => {
	browser.runtime.sendMessage({ getLocale: true }).then(locale => {
		$.i18n({
			locale: locale,
		});
		$.i18n()
			.load('../i18n/locales.json')
			.promise()
			.then(() => {
				initPopups();
				initConfig();
				initConfigSwitch();
				initFormSubmit();
				fillLocale();
			});
	});
});
