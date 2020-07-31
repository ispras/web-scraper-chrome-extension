/*
 * Support for "[date<dd.MM.yyyy><01.01.2016><now>]" pattern
 *
 * @author © Denis Bakhtenkov denis.bakhtenkov@gmail.com
 * @version 2016
 */
import DateRoller from './DateRoller';
import SimpleDateFormatter from './SimpleDateFormatter';

export default class DatePatternSupport {
	/**
	 *
	 * @param {String} startUrl
	 * @returns {Array}
	 */
	static expandUrl(startUrl) {
		function nowSupport(d) {
			switch (d) {
				case 'now':
					return df.format(new Date());
				case 'yesterday':
					var date = new Date();
					date.setDate(date.getDate() - 1);
					return df.format(new Date(date));
				case 'tomorrow':
					var date = new Date();
					date.setDate(date.getDate() + 1);
					return df.format(new Date(date));
				default:
					return d;
			}
		}

		let startUrls = startUrl;
		// single start url
		if (startUrl.push === undefined) {
			startUrls = [startUrls];
		}

		let df;
		let urls = [];
		startUrls.forEach(function (startUrl) {
			let re = /^(.*?)\[date<(.*)><(.*)><(.*)>\](.*)$/;
			let matches = startUrl.match(re);
			if (matches) {
				df = new SimpleDateFormatter(matches[2]);
				let startDate = df.parse(nowSupport(matches[3]));
				let endDate = df.parse(nowSupport(matches[4]));

				let roller = DateRoller.days(startDate, endDate);
				roller.forEach(function (date) {
					urls.push(matches[1] + df.format(date) + matches[5]);
				});
			} else {
				urls.push(startUrl);
			}
		});

		return urls;
	}
}
