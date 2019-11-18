var Config = function () {

};

Config.prototype = {

	sitemapDb: '<use loadConfiguration()>',
	dataDb: '<use loadConfiguration()>',
	mongoUrl: '<use loadConfiguration()>',
	mongoCollection: '<use loadConfiguration()>',
	mongoUsername: '<use loadConfiguration()>',
	mongoPassword: '<use loadConfiguration()>',

	defaults: {
		storageType: "local",
		// this is where sitemap documents are stored
		sitemapDb: "scraper-sitemaps",
		// this is where scraped data is stored.
		// empty for local storage
		dataDb: "",
		mongoUrl: "",
		mongoCollection: "sitemaps",
	},

	/**
	 * Loads configuration from chrome extension sync storage
	 */
	loadConfiguration: function (callback) {

		chrome.storage.sync.get(['sitemapDb', 'dataDb', 'storageType',
			'mongoUrl', 'mongoCollection'], function (items) {

			this.storageType = items.storageType || this.defaults.storageType;

			this.sitemapDb = this.defaults.sitemapDb;
			this.dataDb = this.defaults.dataDb;
			this.mongoUrl = this.defaults.mongoUrl;
			this.mongoCollection = this.defaults.mongoCollection;

			if (this.storageType === 'couchdb') {
				this.sitemapDb = items.sitemapDb || this.defaults.sitemapDb;
				this.dataDb = items.dataDb || this.defaults.dataDb;

			} else if (this.storageType === 'mongodb') {

				this.mongoUrl = items.mongoUrl || this.defaults.mongoUrl;
				this.mongoCollection = items.mongoCollection || this.defaults.mongoCollection;

			}

			callback();
		}.bind(this));
	},

	/**
	 * Saves configuration to chrome extension sync storage
	 * @param {type} items
	 * @param {type} callback
	 * @returns {undefined}
	 */
	updateConfiguration: function (items, callback) {
		chrome.storage.sync.set(items, callback);
	}
};