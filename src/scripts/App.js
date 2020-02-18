import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '../devtools/panel.css';

import StoreDevtools from './StoreDevtools';
import SitemapController from './Controller';

$(function() {
	// init bootstrap alerts
	$('.alert').alert();

	new SitemapController(new StoreDevtools(), 'views/');
});
