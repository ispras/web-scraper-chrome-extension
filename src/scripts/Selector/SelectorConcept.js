import SelectorElement from './SelectorElement';

export default class SelectorConcept extends SelectorElement {
	getFeatures() {
		return [...super.getFeatures(), 'conceptTypeId'];
	}
}
