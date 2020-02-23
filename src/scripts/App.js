import 'bootstrap/dist/css/bootstrap.css';
import 'jquery-flexdatalist/jquery.flexdatalist.css';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator.css';
import '../devtools/panel.css';
import 'bootstrap/dist/js/bootstrap';
import StoreDevtools from './StoreDevtools';
import SitemapController from './Controller';

$(function() {
	// init bootstrap alerts
	$('.alert').alert();

	new SitemapController(new StoreDevtools(), 'views/');
});
