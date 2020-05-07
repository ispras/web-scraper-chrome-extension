/**
 * Formatter for Date, parse and format with pattern
 *
 * @author © Denis Bakhtenkov denis.bakhtenkov@gmail.com
 * @version 2016
 * @param {String} pattern
 * default is dd.MM.yyyy
 * @returns {SimpleDateFormatter}
 */
export default class SimpleDateFormatter {
	constructor(pattern) {
		this.pattern = pattern || 'dd.MM.yyyy';
		this.months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
	}

	/**
	 * Return pattern
	 * @returns {String}
	 */
	getPattern() {
		return this.pattern;
	}

	/**
	 * 'dd.MM.yyyy hh:mm:ss'
	 * @param {Date} date
	 * @returns {String}
	 */
	format(date) {
		/**
		 * Adding left 'zero' if value's length less than digits
		 * @param {Number} value
		 * @param {Number} digits
		 * @returns {String}
		 */
		function lzero(value, digits) {
			digits = digits || 2;
			let result = value.toString();
			while (result.length < digits) {
				result = `0${result}`;
			}
			return result;
		}

		const variants = {
			yyyy: date.getFullYear(),
			yy: lzero(date.getFullYear() % 100),
			MMM: this.months[date.getMonth()],
			MM: lzero(date.getMonth() + 1),
			dd: lzero(date.getDate()),
			hh: lzero(date.getHours()),
			mm: lzero(date.getMinutes()),
			sss: lzero(date.getMilliseconds(), 3),
			ss: lzero(date.getSeconds()),
		};

		let format = this.pattern;

		for (const i in variants) {
			format = format.replace(i, variants[i]);
		}

		return format;
	}

	/**
	 * 16.06.2016
	 * dd.MM.yyyy
	 *
	 * @param {String} string
	 * @returns {Date}
	 */
	parse(string) {
		const date = new Date(0);
		let pat = this.pattern;
		let input = string;
		const variants = {
			yyyy(value) {
				return date.setFullYear(parseInt(value, 10));
			},
			yy(value) {
				return date.setFullYear(parseInt(value, 10) + 2000);
			},
			MMM(value) {
				return date.setMonth(parseInt(value, 10));
			},
			MM(value) {
				return date.setMonth(parseInt(value, 10) - 1);
			},
			dd(value) {
				return date.setDate(parseInt(value, 10));
			},
			hh(value) {
				return date.setHours(parseInt(value, 10));
			},
			mm(value) {
				return date.setMinutes(parseInt(value, 10));
			},
			sss(value) {
				return date.setMilliseconds(parseInt(value, 10));
			},
			ss(value) {
				return date.setSeconds(parseInt(value, 10));
			},
		};
		for (const i in variants) {
			const pos = pat.search(i);
			if (pos !== -1) {
				const value = input.substr(pos, i.length);
				input = input.substring(0, pos) + input.substring(pos + i.length);
				pat = pat.substring(0, pos) + pat.substring(pos + i.length);
				if (i === 'MMM') {
					for (const j in this.months) {
						if (value === this.months[j]) {
							variants[i](j);
							break;
						}
					}
				} else {
					variants[i](value);
				}
			}
		}

		return date;
	}
}
