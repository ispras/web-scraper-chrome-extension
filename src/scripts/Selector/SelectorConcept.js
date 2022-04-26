import Selector from '../Selector';

export default class SelectorConcept extends Selector {
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

	canUseLikeContainer() {
		return true;
	}

	async _getData(parentElement) {
		return this.getDataElements(parentElement);
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'mergeIntoList'];
	}
}
