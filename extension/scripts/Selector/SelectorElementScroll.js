var SelectorElementScroll = {

	canReturnMultipleRecords: function () {
		return true;
	},

	canHaveChildSelectors: function () {
		return true;
	},

	canHaveLocalChildSelectors: function () {
		return true;
	},

	canCreateNewJobs: function () {
		return false;
	},
	willReturnElements: function () {
		return true;
	},
	scrollToBottom: function() {
		window.scrollTo(0,document.body.scrollHeight);
	},
	_getData: function (parentElement) {
            
                var paginationLimit = parseInt(this.paginationLimit);
                var paginationCount = 1;
                var delay = parseInt(this.delay) || 0;
		var deferredResponse = $.Deferred();
		var foundElements = [];

		// initially scroll down and wait
		this.scrollToBottom();
		var nextElementSelection = (new Date()).getTime()+delay;

		// infinitely scroll down and find all items
		var interval = setInterval(function() {

			var now = (new Date()).getTime();
			// sleep. wait when to extract next elements
			if(now < nextElementSelection) {
				return;
			}

			var elements = this.getDataElements(parentElement);
			// no new elements found or pagination limit
			if(elements.length === foundElements.length || paginationCount >= paginationLimit) {
				clearInterval(interval);
				deferredResponse.resolve(jQuery.makeArray(elements));
			}
			else {
                                paginationCount++;
				// continue scrolling and add delay
				foundElements = elements;
				this.scrollToBottom();
				nextElementSelection = now+delay;
			}

		}.bind(this), 50);

		return deferredResponse.promise();
	},

	getDataColumns: function () {
		return [];
	},

	getFeatures: function () {
		return ['selector', 'multiple', 'delay', 'paginationLimit'];
	}
};
