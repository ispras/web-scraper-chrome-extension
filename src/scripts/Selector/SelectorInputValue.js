import Selector from '../Selector';

export default class SelectorInputValue extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return false;
	}

	canHaveChildSelectors() {
		return true;
	}

	canHaveLocalChildSelectors() {
		return true;
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
				$(element).val(this.value);
			}.bind(this)
		);

		var data = {};
		data[this.id] = this.value;
		result.push(data);

		dfd.resolve(result);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['value', 'selector'];
	}
}
