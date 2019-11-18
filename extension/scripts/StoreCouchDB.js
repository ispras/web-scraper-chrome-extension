var StoreCouchDB = function (config) {
    this.config = config;

    // configure couchdb
    this.sitemapDb = new PouchDB(this.config.sitemapDb);
};

var StoreScrapeResultWriter = function(db) {
   this.db = db;
};

/**
* Make sure all obj have the same properties
* They can differe if table selector retrieves dynamic columns
*/
var normalizeProperties = function (docs) {
    // get all keys of the objects
    var keys = [];
    docs.forEach(function (doc) {
        for (var key in doc) {
            if (doc.hasOwnProperty(key) && keys.indexOf(key) === -1) { keys.push(key); }
        };
    });

    // add missing keys to objects
    docs.forEach(function (doc) {
        var objKeys = Object.keys(doc)
        keys.forEach(function (key) {
            if (!(key in doc)) {
                doc[key] = "";
            }
        });
    });
};

StoreScrapeResultWriter.prototype = {

    writeDocs: function(docs, callback) {
		if(docs.length === 0) {
			callback();
		}
        else {

            normalizeProperties(docs);
			this.db.bulkDocs({docs:docs}, function(err, response) {
				if(err !== null) {
					console.log("Error while persisting scraped data to db", err);
				}
				callback();
			});
		}
    }
};

StoreCouchDB.prototype = {

	sanitizeSitemapDataDbName: function(dbName) {
		return 'sitemap-data-'+dbName.replace(/[^a-z0-9_\$\(\)\+\-/]/gi, "_");
	},
	getSitemapDataDbLocation: function(sitemapId) {
		var dbName = this.sanitizeSitemapDataDbName(sitemapId);
		return this.config.dataDb+dbName;
	},
	getSitemapDataDb: function(sitemapId) {
		
		var dbLocation = this.getSitemapDataDbLocation(sitemapId);
        return new PouchDB(dbLocation);
    },
	
	/**
	 * creates or clears a sitemap db
	 * @param {type} sitemapId
	 * @returns {undefined}
	 */
    initSitemapDataDb: function(sitemapId, callback) {
		var dbLocation = this.getSitemapDataDbLocation(sitemapId);
		var store = this;

		PouchDB.destroy(dbLocation, function() {
			var db = store.getSitemapDataDb(sitemapId);
            var dbWriter = new StoreScrapeResultWriter(db);
			callback(dbWriter);
		});
	},

    createSitemap: function (sitemap, callback) {

        var sitemapJson = JSON.parse(JSON.stringify(sitemap));

        if(!sitemap._id) {
            console.log("cannot save sitemap without an id", sitemap);
        }

        this.sitemapDb.put(sitemapJson, function(sitemap, err, response) {
            // @TODO handle err
            if (response) {
                sitemap._rev = response.rev;
            }            
            callback(sitemap);
        }.bind(this, sitemap));
    },
    saveSitemap: function (sitemap, callback) {
        // @TODO remove
        this.createSitemap(sitemap, callback);
    },
    deleteSitemap: function (sitemap, callback) {

        sitemap = JSON.parse(JSON.stringify(sitemap));

        this.sitemapDb.remove(sitemap, function(err, response){
            // @TODO handle err

			// delete sitemap data db
			var dbLocation = this.getSitemapDataDbLocation(sitemap._id);
			PouchDB.destroy(dbLocation, function() {
				callback();
			}.bind(this));
		}.bind(this));
    },
    getAllSitemaps: function (callback) {

        this.sitemapDb.allDocs({include_docs: true}, function(err, response) {
            var sitemaps = [];
            for (var i in response.rows) {
                var sitemap = response.rows[i].doc;
                if (!chrome.extension) {
                    sitemap = new Sitemap(sitemap);
                }

                sitemaps.push(sitemap);
            }
            callback(sitemaps);
        });
    },

    getSitemapData: function (sitemap, callback) {

        var db = this.getSitemapDataDb(sitemap._id);
        db.allDocs({include_docs: true}, function(err, response) {
            var responseData = [];
            for (var i in response.rows) {
                var doc = response.rows[i].doc;
                responseData.push(doc);
            }
            normalizeProperties(responseData);
            callback(responseData);
        }.bind(this));
    },
	// @TODO make this call lighter
    sitemapExists: function (sitemapId, callback) {
        this.getAllSitemaps(function (sitemaps) {
            var sitemapFound = false;
            for (var i in sitemaps) {
                if (sitemaps[i]._id === sitemapId) {
                    sitemapFound = true;
                }
            }
            callback(sitemapFound);
        });
    }
};