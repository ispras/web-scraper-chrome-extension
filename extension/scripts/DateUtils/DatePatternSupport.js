/* 
 * Support for "[date<dd.MM.yyyy><01.01.2016><now>]" pattern
 * 
 * @author © Denis Bakhtenkov denis.bakhtenkov@gmail.com
 * @version 2016
 */

/* global DateRoller */

var DatePatternSupport = {
	/**
	 * 
	 * @param {String} startUrl
	 * @returns {Array}
	 */
	expandUrl: function (startUrl) {

		function nowSupport(d) {
			switch (d) {
				case "now":
					return df.format(new Date());
				case "yesterday":
					var date = new Date();
					date.setDate(date.getDate() - 1);
					return df.format(new Date(date));
				case "tomorrow":
					var date = new Date();
					date.setDate(date.getDate() + 1);
					return df.format(new Date(date));
				default:
					return d;
			}
		}

		var startUrls = startUrl;
		// single start url
		if (startUrl.push === undefined) {
			startUrls = [startUrls];
		}

		var df;
		var urls = [];
		startUrls.forEach(function (startUrl) {
			var re = /^(.*?)\[date<(.*)><(.*)><(.*)>\](.*)$/;
			var matches = startUrl.match(re);
			if (matches) {
				df = new SimpleDateFormatter(matches[2]);
				var startDate = df.parse(nowSupport(matches[3]));
				var endDate = df.parse(nowSupport(matches[4]));

				var roller = DateRoller.days(startDate, endDate);
				roller.forEach(function (date) {
					urls.push(matches[1] + df.format(date) + matches[5]);
				});

			} else {
				urls.push(startUrl);
			}
		});

		return urls;
	}

};