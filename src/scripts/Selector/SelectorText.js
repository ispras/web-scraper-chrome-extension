import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorText extends Selector {
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

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		let texts = elements.map(element => {
			// remove script, style tag contents from text results
			const $elementClone = $(element).clone();
			$elementClone.find('script, style').remove();
			// <br> replace br tags with newlines
			$elementClone.find('br').after('\n');
			return $elementClone.text();
		});
		if (!this.multiple) {
			texts = texts.length ? texts[0] : null;
		}
		return [{ [this.id]: texts }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'textmanipulation'];
	}
}
