var SelectorLink = {
	canReturnMultipleRecords: function () {
		return true;
	},

	canHaveChildSelectors: function () {
		return true;
	},

	canHaveLocalChildSelectors: function () {
		return false;
	},

	canCreateNewJobs: function () {
		return true;
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

			deferredDataExtractionCalls.push(function(element) {
				var deferredData = $.Deferred();
				var data = {};

				var extracted_value;
				if (this.extractAttribute) {
					extracted_value = element[this.extractAttribute];
				} else {
					extracted_value = $(element).text();
				}
				extracted_value = this.stringReplace(extracted_value, this.stringReplacement);

				data[this.id] = $(element).text();
				data[this.id + '-href'] = extracted_value;
				data._followSelectorId= this.id;
				data._follow = extracted_value;
				deferredData.resolve(data);

				return deferredData;
			}.bind(this, element));
		}.bind(this));

		$.whenCallSequentially(deferredDataExtractionCalls).done(function(responses) {
			var result = [];
			responses.forEach(function(dataResult) {
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
        return ['selector', 'extractAttribute', 'multiple', 'delay', 'stringReplacement']
	},

	getItemCSSSelector: function() {
		return "a";
	}
};