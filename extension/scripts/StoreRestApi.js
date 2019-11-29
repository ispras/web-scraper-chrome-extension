var StoreRestApi = function (config) {
    this.uri = config.restUrl;
};

StoreRestApi.prototype = {

    createSitemap: function (sitemap, callback) {
        this.saveSitemap(sitemap, callback);
    },
    saveSitemap: function (sitemap, callback) {
        url = this.uri;
        this.sitemapExists(sitemap._id, function (exists) {
            if (exists) {
                //update sitemap
                $.ajax({
                    type : "PUT",
                    url: url + '/sitemaps/' + sitemap._id,
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
                    url: url + '/sitemaps/',
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
            url: this.uri + '/sitemaps/' + sitemap._id,
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
            url : this.uri + '/sitemaps/',
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
    getSitemapData: function (sitemap, callback) {
        $.ajax({
            type : "GET",
            url : this.uri + '/sitemaps/',
            success : function (data) {
                let sitemap;
                for (let i in response) {
                    if (data[i]._id === sitemap._id){
                        sitemap = new Sitemap(data[i]);
                    }
                }
                callback(sitemap);
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
            url : this.uri + '/sitemaps/',
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
    }
};