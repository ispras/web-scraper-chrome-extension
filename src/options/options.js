import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap';
import Config from '../scripts/Config';

$(function() {
	// popups for Storage setting input fields
	$('#sitemapDb')
		.popover({
			title: 'Database for sitemap storage',
			html: true,
			content: 'CouchDB database url<br /> http://example.com/scraper-sitemaps/',
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#dataDb')
		.popover({
			title: 'Database for scraped data',
			html: true,
			content: 'CouchDB database url. For each sitemap a new DB will be created.<br />http://example.com/',
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

	$('#restUrl')
		.popover({
			title: 'Url to push your sitemaps.',
			html: true,
			content: 'Rest api url.',
			placement: 'bottom',
		})
		.blur(function() {
			$(this).popover('hide');
		});

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

	// Extension configuration
	let config = new Config();

	// load previously synced data
	config.loadConfiguration().then(() => {
		$('#locale').val(config.locale);
		$('#storageType').val(config.storageType);
		$('#sitemapDb').val(config.sitemapDb);
		$('#dataDb').val(config.dataDb);
		$('#restUrl').val(config.restUrl);

		$('select[name=storageType]').change();
	});

	// Sync storage settings
	$('form#storage_configuration').submit(function() {
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
			})
			.catch(() => {
				$('.alert')
					.attr('id', 'error')
					.text($.i18n('options-error-updating') + chrome.runtime.lastError.message)
					.show();
			});

		return false;
	});
});
