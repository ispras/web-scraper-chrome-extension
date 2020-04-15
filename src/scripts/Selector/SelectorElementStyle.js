import Selector from '../Selector';

export default class SelectorElementStyle extends Selector {
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
		let styles = elements.map(element => $(element).css(this.extractStyle));
		if (!this.multiple) {
			styles = styles.length ? styles[0] : null;
		}
		dfd.resolve([{ [this.id]: styles }]);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'extractStyle', 'delay', 'textmanipulation'];
	}
}
