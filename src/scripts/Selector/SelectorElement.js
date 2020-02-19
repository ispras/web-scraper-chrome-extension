import Selector from '../Selector';

export default class SelectorElement extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
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
		return true;
	}

	_getData(parentElement) {
		var dfd = $.Deferred();

		var elements = this.getDataElements(parentElement);
		dfd.resolve(jQuery.makeArray(elements));

		return dfd.promise();
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay'];
	}
}
