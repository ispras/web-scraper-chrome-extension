/**
 * Formatter for Date, parse and format with pattern
 * 
 * @author © Denis Bakhtenkov denis.bakhtenkov@gmail.com
 * @version 2016
 * @param {String} pattern
 * default is dd.MM.yyyy
 * @returns {SimpleDateFormatter}
 */
var SimpleDateFormatter = function (pattern) {
	this.pattern = pattern || "dd.MM.yyyy";
	this.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
};

/**
 * Return pattern
 * @returns {String}
 */
SimpleDateFormatter.prototype.getPattern = function () {
	return this.pattern;
};

/**
 * 'dd.MM.yyyy hh:mm:ss'
 * @param {Date} date
 * @returns {String}
 */
SimpleDateFormatter.prototype.format = function (date) {

	/**
	 * Adding left 'zero' if value's length less than digits
	 * @param {Number} value
	 * @param {Number} digits
	 * @returns {String}
	 */
	function lzero(value, digits) {
		digits = digits || 2;
		var result = value.toString();
		while (result.length < digits) {
			result = "0" + result;
		}
		return result;
	}

	var variants = {
		yyyy: date.getFullYear(),
		yy: lzero(date.getFullYear() % 100),
		MMM: this.months[date.getMonth()],
		MM: lzero(date.getMonth() + 1),
		dd: lzero(date.getDate()),
		hh: lzero(date.getHours()),
		mm: lzero(date.getMinutes()),
		sss: lzero(date.getMilliseconds(), 3),
		ss: lzero(date.getSeconds())
	};

	var format = this.pattern;

	for (var i in variants) {
		format = format.replace(i, variants[i]);
	}

	return format;
};

/**
 * 16.06.2016
 * dd.MM.yyyy
 * 
 * @param {String} string
 * @returns {Date}
 */
SimpleDateFormatter.prototype.parse = function (string) {

	var date = new Date(0);
	var pat = this.pattern;
	var input = string;
	var variants = {
		yyyy: "date.setFullYear(parseInt(value));",
		yy: "date.setYear(parseInt(value) + 2000);",
		MMM: "date.setMonth(parseInt(value));",
		MM: "date.setMonth(parseInt(value) - 1);",
		dd: "date.setDate(parseInt(value));",
		hh: "date.setHours(parseInt(value));",
		mm: "date.setMinutes(parseInt(value));",
		sss: "date.setMilliseconds(parseInt(value));",
		ss: "date.setSeconds(parseInt(value));"
	};

	for (var i in variants) {
		var pos = pat.search(i);
		if (pos !== -1) {
			var value = input.substr(pos, i.length);
			input = input.substring(0, pos) + input.substring(pos + i.length);
			pat = pat.substring(0, pos) + pat.substring(pos + i.length);
			if (i === "MMM") {
				for (var j in this.months) {
					if (value === this.months[j]) {
						value = j;
						eval(variants[i]);
						break;
					}
				}
			} else {
				eval(variants[i]);
			}
		}
	}

	return date;
};