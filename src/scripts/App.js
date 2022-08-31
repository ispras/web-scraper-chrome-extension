import 'bootstrap/dist/css/bootstrap.css';
import 'jquery-flexdatalist/jquery.flexdatalist.css';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator.css';
import '../devtools/panel.css';
import 'bootstrap/dist/js/bootstrap';
import StoreDevtools from './StoreDevtools';
import SitemapController from './Controller';
import * as browser from 'webextension-polyfill';
import TalismanStoreDevtools from './TalismanStoreDevtools';

$(async function () {
	// init bootstrap alerts
	$('.alert').alert();
	let request = {
		getStorageType: true,
	};
	const storageType = await browser.runtime.sendMessage(request);
	new SitemapController(
		storageType === 'StoreTalismanApi'
			? new TalismanStoreDevtools(storageType)
			: new StoreDevtools(storageType),
		'views/'
	);
});
