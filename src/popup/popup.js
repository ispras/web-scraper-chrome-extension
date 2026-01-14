import 'bootstrap/dist/css/bootstrap.css';
import 'jquery-flexdatalist/jquery.flexdatalist.css';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator.css';
import './popup.css';
import 'bootstrap/dist/js/bootstrap';
import StoreDevtools from '../scripts/StoreDevtools';
import SitemapController from '../scripts/Controller';
import * as browser from 'webextension-polyfill';
import TalismanStoreDevtools from '../scripts/TalismanStoreDevtools';

// Initialize popup when DOM is ready
$(async function () {
	// Init bootstrap alerts
	$('.alert').alert();

	// Get storage type from background script
	let request = {
		getStorageType: true,
	};
	const storageType = await browser.runtime.sendMessage(request);

	// Initialize the controller with popup context
	new SitemapController(
		storageType === 'StoreTalismanApi'
			? new TalismanStoreDevtools(storageType)
			: new StoreDevtools(storageType),
		'../devtools/views/' // Views are still in devtools folder
	);

	// Settings button handler
	$('#btn-settings').on('click', function () {
		browser.runtime.openOptionsPage();
	});
});
