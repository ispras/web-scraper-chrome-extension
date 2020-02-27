import Selector from '../Selector';

export default class SelectorHTML extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
	}

	canHaveChildSelectors() {
		return false;
	}

	canHaveLocalChildSelectors() {
		return false;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return false;
	}

	_getData(parentElement) {
		var dfd = $.Deferred();

		var elements = this.getDataElements(parentElement);

		var result = [];
		$(elements).each(
			function(k, element) {
				var data = {};
				var html = $(element).html();

				// do something

				data[this.id] = html;

				result.push(data);
			}.bind(this)
		);

		if (this.multiple === false && elements.length === 0) {
			var data = {};
			data[this.id] = null;
			result.push(data);
		}

		dfd.resolve(result);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'textmanipulation', 'delay'];
	}
}
