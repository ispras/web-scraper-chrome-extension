var SelectorImage = {
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

		var dfd = $.Deferred();

		var elements = this.getDataElements(parentElement);

		var deferredDataCalls = [];
		$(elements).each(function(i, element) {
			deferredDataCalls.push(function() {

                var deferredData = $.Deferred(),
                    data = {},
                    src = element.src;

                // get url from style
                if (src == null) {
                    src = $(element).css("background-image");
                    src = /^url\((['"]?)(.*)\1\)$/.exec(src);
                    src = src ? src[2] : "";
                }  

                if (this.stringReplacement && this.stringReplacement.replaceString) {
                    var replace;
                    var replacement = this.stringReplacement.replacementString || "";
                    try {
                        var regex = new RegExp(this.stringReplacement.replaceString, 'gm');
                        replace = regex.test(src) ? regex : this.stringReplacement.replaceString;
                    } catch (e) { replace = this.stringReplacement.replaceString; }

                    src = src.replace(replace, replacement);
                }

                data[this.id + '-src'] = src;

				// download image if required
				if(!this.downloadImage) {
					deferredData.resolve(data);
				}
				else {
                    var deferredFileBase64 = this.downloadFileAsBase64(src);
					deferredFileBase64.done(function(imageResponse) {

						data['_fileBase64-'+this.id] = imageResponse.fileBase64;
						data['_fileMimeType-'+this.id] = imageResponse.mimeType;
						data['_filename'+this.id] = imageResponse.filename;

						deferredData.resolve(data);
					}.bind(this)).fail(function() {
						// failed to download image continue.
						// @TODO handle errror
						deferredData.resolve(data);
					});
				}

				return deferredData.promise();
			}.bind(this));
		}.bind(this));

		$.whenCallSequentially(deferredDataCalls).done(function(dataResults) {

			if (this.multiple === false && elements.length === 0) {
				var data = {};
				data[this.id+'-src'] = null;
				dataResults.push(data);
			}

			dfd.resolve(dataResults);
		});

		return dfd.promise();
	},

	getDataColumns: function () {
		return [this.id + '-src'];
	},

	getFeatures: function () {
        return ['selector', 'multiple', 'delay', 'downloadImage', 'stringReplacement']
	},

	getItemCSSSelector: function() {
		return ["img", "div"];
	}
};