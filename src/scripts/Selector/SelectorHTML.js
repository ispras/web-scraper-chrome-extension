import Selector from '../Selector';

export default class SelectorHTML extends Selector {
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
		let htmls = elements.map(element => $(element).html());
		if (!this.multiple) {
			htmls = htmls.length ? htmls[0] : null;
		}
		dfd.resolve([{ [this.id]: htmls }]);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'textmanipulation', 'delay'];
	}
}
