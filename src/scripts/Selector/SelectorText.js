import Selector from '../Selector';

export default class SelectorText extends Selector {
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
		let dfd = $.Deferred();

		let elements = this.getDataElements(parentElement);

		let result = [];
		$(elements).each(
			function(k, element) {
				let data = {};

				// remove script, style tag contents from text results
				let $element_clone = $(element).clone();
				$element_clone.find('script, style').remove();
				// <br> replace br tags with newlines
				$element_clone.find('br').after('\n');
				data[this.id] = $element_clone.text();

				result.push(data);
			}.bind(this)
		);

		if (this.multiple === false && elements.length === 0) {
			let data = {};
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
		return ['selector', 'multiple', 'delay', 'textmanipulation'];
	}
}
