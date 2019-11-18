var StoreMongoDB = function (config) {
    this.uri = config.mongoUrl;
    this.collection = config.mongoCollection;
};

StoreMongoDB.prototype = {
    createSitemap: function (sitemap, callback) {

        MongoClient.connect(this.uri, function(err, db) {
            var col = db.collection(this.collection);

            col.insert(sitemap, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    callback();
                }
            });
            db.close();
        });
    },
    saveSitemap: function (sitemap, callback) {
        this.createSitemap(sitemap, callback);
    },
    deleteSitemap: function (sitemap, callback) {

        MongoClient.connect(this.uri, function(err, db) {
            var col = db.collection(this.collection);

            col.remove({"_id": sitemap._id}, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    callback();
                }
            });
            db.close();
        });
    },
    getAllSitemaps: function (callback) {

        MongoClient.connect(this.uri, function(err, db) {
            var col = db.collection(this.collection);

            col.find({}, function(err, response) {
                if (err) {
                    console.log(err);
                } else {
                    var sitemaps = [];
                    for (var i in response) {
                        sitemaps.push(new Sitemap(response[i]));
                    }
                    callback(sitemaps);
                }
            });
            db.close();
        });

    },
    getSitemapData: function (sitemap, callback) {

        MongoClient.connect(this.uri, function(err, db) {
            var col = db.collection(this.collection);

            col.find({"_id": sitemap._id}, function(err, sitemap) {
                if (err) {
                    console.log(err);
                } else {
                    callback(sitemap);
                }
            });
            db.close();
        });
    },
    sitemapExists: function (sitemapId, callback) {

        MongoClient.connect(this.uri, function(err, db) {
            var col = db.collection(this.collection);

            col.count({"_id": sitemapId}, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    callback(result === 1);
                }
            });
            db.close();
        });
    }
};