var SelectorDocument = {
    canReturnMultipleRecords: function () {
        return true;
    },

    canHaveChildSelectors: function () {
        return false;
    },

    canHaveLocalChildSelectors: function () {
        return false;
    },

    canCreateNewJobs: function () {
        return false;
    },

    willReturnElements: function () {
        return false;
    },

    _getData: function (parentElement) {

        var elements = this.getDataElements(parentElement);

        var dfd = $.Deferred();

        // return empty record if not multiple type and no elements found
        if (this.multiple === false && elements.length === 0) {
            var data = {};
            data[this.id] = null;
            dfd.resolve([data]);
            return dfd;
        }

        // extract links one by one
        var deferredDataExtractionCalls = [];
        $(elements).each(function (k, element) {

            deferredDataExtractionCalls.push(function (element) {

                var href = element.href;
                if (this.stringReplacement && this.stringReplacement.replaceString) {
                    var replace;
                    var replacement = this.stringReplacement.replacementString || "";
                    try {
                        var regex = new RegExp(this.stringReplacement.replaceString, 'gm');
                        replace = regex.test(href) ? regex : this.stringReplacement.replaceString;
                    } catch (e) {
                        replace = this.stringReplacement.replaceString;
                    }

                    href = href.replace(replace, replacement);
                }

                var deferredData = $.Deferred();
                var data = {};

                data[this.id] = $(element).text();
                // data._followSelectorId = this.id;
                data[this.id + '-href'] = href;
                // data._follow = href;
                // download image if required
                if(!this.downloadDocument) {
                    deferredData.resolve(data);
                }
                else {
                    var deferredFileBase64 = this.downloadFileAsBase64(href);

                    deferredFileBase64.done(function(base64Response) {

                        data['_fileBase64-'+this.id] = base64Response.fileBase64;
                        data['_fileMimeType-'+this.id] = base64Response.mimeType;
                        data['_filename'+this.id] = base64Response.filename;

                        deferredData.resolve(data);
                    }.bind(this)).fail(function() {
                        // failed to download image continue.
                        // @TODO handle errror
                        deferredData.resolve(data);
                    });
                }
                return deferredData.promise();
            }.bind(this, element));
        }.bind(this));

        $.whenCallSequentially(deferredDataExtractionCalls).done(function (responses) {
            var result = [];
            responses.forEach(function (dataResult) {
                result.push(dataResult);
            });
            dfd.resolve(result);
        });

        return dfd.promise();
    },


    getDataColumns: function () {
        return [this.id, this.id + '-href'];
    },

    getFeatures: function () {
        return ['selector','multiple', 'delay','downloadDocument','stringReplacement']
    }

    // getItemCSSSelector: function() {
    // 	return ["img", "div"];
    // }
};