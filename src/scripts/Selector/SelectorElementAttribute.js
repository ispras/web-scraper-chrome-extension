import Selector from '../Selector';

export default class SelectorElementAttribute extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return false;
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
		let attributes = elements.map(element => $(element).attr(this.extractAttribute));
		if (!this.multiple) {
			attributes = attributes.length ? attributes[0] : null;
		}
		dfd.resolve([{ [this.id]: attributes }]);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'extractAttribute', 'delay', 'textmanipulation'];
	}
}
