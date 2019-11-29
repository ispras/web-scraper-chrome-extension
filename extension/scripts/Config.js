var Config = function () {

};

Config.prototype = {

	sitemapDb: '<use loadConfiguration()>',
	dataDb: '<use loadConfiguration()>',
	restUrl: '<use loadConfiguration()>',

	defaults: {
		storageType: "local",
		// this is where sitemap documents are stored
		sitemapDb: "scraper-sitemaps",
		// this is where scraped data is stored.
		// empty for local storage
		dataDb: "",
		restUrl: ""
	},

	/**
	 * Loads configuration from chrome extension sync storage
	 */
	loadConfiguration: function (callback) {

		chrome.storage.sync.get(['sitemapDb', 'dataDb', 'storageType',
			'restUrl'], function (items) {

			this.storageType = items.storageType || this.defaults.storageType;

			this.sitemapDb = this.defaults.sitemapDb;
			this.dataDb = this.defaults.dataDb;
			this.restUrl = this.defaults.restUrl;

			if (this.storageType === 'couchdb') {
				this.sitemapDb = items.sitemapDb || this.defaults.sitemapDb;
				this.dataDb = items.dataDb || this.defaults.dataDb;

			} else if (this.storageType === 'rest') {
				this.restUrl = items.restUrl || this.defaults.restUrl;
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