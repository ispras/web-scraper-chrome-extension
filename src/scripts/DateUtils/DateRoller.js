/*
 * Iterator from first day to second
 *
 * @author © Denis Bakhtenkov denis.bakhtenkov@gmail.com
 * @version 2016
 */

export default class DateRoller {
	/**
	 *
	 * @param {Date} from
	 * @param {Date} to
	 * @returns {Array} all days between From and To
	 */
	static days(from, to) {
		/**
		 *
		 * @param {Date} first
		 * @param {Date} second
		 * @returns {Number}
		 */
		function compareDays(first, second) {
			const day = 24 * 60 * 60 * 1000;
			return Math.floor(first / day) - Math.floor(second / day);
		}

		const res = [];
		const curDate = new Date(from);
		const step = from <= to ? 1 : -1;

		do {
			res.push(new Date(curDate));
			curDate.setDate(curDate.getDate() + step);
		} while (compareDays(curDate, to) * step <= 0);

		return res;
	}
}
