$(function () {

	// popups for Storage setting input fields
	$("#sitemapDb")
		.popover({
			title: 'Database for sitemap storage',
			html: true,
			content: "CouchDB database url<br /> http://example.com/scraper-sitemaps/",
			placement: 'bottom'
		})
		.blur(function () {
			$(this).popover('hide');
		});

	$("#dataDb")
		.popover({
			title: 'Database for scraped data',
			html: true,
			content: "CouchDB database url. For each sitemap a new DB will be created.<br />http://example.com/",
			placement: 'bottom'
		})
		.blur(function () {
			$(this).popover('hide');
		});

	$("#mongoUrl")
		.popover({
			title: 'Url to connect to Mongo database.',
			html: true,
			content: "MongoDB database url. All sitemaps stored in one collection.<br /> " +
				"mongodb://[username:password@]host1[:port1]][/[database]",
			placement: 'bottom'
		})
		.blur(function () {
			$(this).popover('hide');
		});

	// switch between configuration types
	$("select[name=storageType]").change(function () {
		var type = $(this).val();

		if (type === 'couchdb') {

			$(".form-group.couchdb").show();
			$(".form-group.mongodb").hide();

		} else if (type === 'mongodb') {

			$(".form-group.mongodb").show();
			$(".form-group.couchdb").hide();

		} else {

			$(".form-group.mongodb").hide();
			$(".form-group.couchdb").hide();
		}
	});

	// Extension configuration
	var config = new Config();

	// load previously synced data
	config.loadConfiguration(function () {

		$("#storageType").val(config.storageType);
		$("#sitemapDb").val(config.sitemapDb);
		$("#dataDb").val(config.dataDb);
		$("#mongoUrl").val(config.mongoUrl);
		$("#mongoCollection").val(config.mongoCollection);

		$("select[name=storageType]").change();
	});

	// Sync storage settings
	$("form#storage_configuration").submit(function () {

		const storageType = $("#storageType").val();
		const newConfig = {
			storageType: storageType,
			sitemapDb: '',
			dataDb: '',
			mongoUrl : '',
			mongoCollection: '',
		};

		if (storageType === 'couchdb') {
			newConfig.sitemapDb = $("#sitemapDb").val();
			newConfig.dataDb = $("#dataDb").val();
		}
		else if (storageType === 'mongodb') {
			newConfig.mongoUrl = $("#mongoUrl").val();
			newConfig.mongoCollection = $("#mongoCollection").val();
		}

		config.updateConfiguration(newConfig);
		return false;
	});
});