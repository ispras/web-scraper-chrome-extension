var StoreRestApi = function (config) {
    this.base_uri = config.restUrl;
    this.localDataStore = new StorePouchDB(config);
};

StoreRestApi.prototype = {

    createSitemap: function (sitemap, callback) {
        this.saveSitemap(sitemap, callback);
    },
    saveSitemap: function (sitemap, callback) {
        base_uri = this.base_uri;
        this.sitemapExists(sitemap._id, function (exists) {
            if (exists) {
                //update sitemap
                $.ajax({
                    type : "PUT",
                    url: new URL('/sitemaps/' + sitemap._id, base_uri).href,
                    data: new Sitemap(sitemap).exportSitemap(),
                    success : function() {
                        callback(sitemap)
                    },
                    error : function(jqXHR, textStatus, errorThrown) {
                        alert("StoreApi: Error updating sitemap.")
                    },
                    contentType : "application/json"
                });

            } else {
                //create new sitemap
                $.ajax({
                    type : "POST",
                    url: new URL('/sitemaps/', base_uri).href,
                    data: new Sitemap(sitemap).exportSitemap(),
                    success : function() {
                        callback(sitemap)
                    },
                    error : function(jqXHR, textStatus, errorThrown) {
                        alert("StoreApi: Error creating sitemap.")
                    },
                    contentType : "application/json"
                });
            }
        });
    },
    deleteSitemap: function (sitemap, callback) {
        $.ajax({
            type : "DELETE",
            url: new URL('/sitemaps/' + sitemap._id, this.base_uri).href,
            success : callback,
            error : function(jqXHR, textStatus, errorThrown) {
                alert("StoreApi: Error deleting sitemap.")
            },
            contentType : "application/json"
        });
    },
    getAllSitemaps: function (callback) {
        $.ajax({
            type : "GET",
            url : new URL('/sitemaps/', this.base_uri).href,
            success : function (data) {
                let sitemaps = [];
                for (let i in data) {
                    sitemaps.push(new Sitemap(data[i]));
                }
                callback(sitemaps);
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert("StoreApi: Could not get all sitemaps.")
            },
            contentType : "application/json"
        });
    },
    sitemapExists: function (sitemapId, callback) {
        $.ajax({
            type : "GET",
            url : new URL('/sitemaps/', this.base_uri).href,
            success : function (data) {
                let exists = false;
                for (let i in data) {
                    if (data[i]._id === sitemapId){
                        exists = true;
                    }
                }
                callback(exists);
            },
            error : function(jqXHR, textStatus, errorThrown) {
                alert("StoreApi: Could not get all sitemaps.")
            },
            contentType : "application/json"
        });
    },
    initSitemapDataDb: function(sitemapId, callback) {
        this.localDataStore.initSitemapDataDb(sitemapId, callback);
    },
    getSitemapData: function (sitemap, callback) {
        this.localDataStore.getSitemapData(sitemap, callback);
    }
};
