export default class ElementSelector {
	// TODO refactor element selector list into a ~ class
	constructor(element, ignoredClasses) {
		this.element = element;
		this.isDirectChild = true;
		this.tag = element.localName;
		this.tag = this.tag.replace(/:/g, '\\:');

		// nth-of-child(n+1)
		this.indexn = null;
		this.index = 1;
		this.id = null;
		this.classes = [];

		// do not add additinal info to html, body tags.
		// html:nth-of-type(1) cannot be selected
		if (
			this.tag === 'html' ||
			this.tag === 'HTML' ||
			this.tag === 'body' ||
			this.tag === 'BODY'
		) {
			this.index = null;
			return;
		}

		if (element.parentNode !== undefined) {
			// nth-child
			// this.index = [].indexOf.call(element.parentNode.children, element)+1;

			// nth-of-type
			for (let i = 0; i < element.parentNode.children.length; i++) {
				const child = element.parentNode.children[i];
				if (child === element) {
					break;
				}
				if (child.tagName === element.tagName) {
					this.index++;
				}
			}
		}

		if (element.id !== '') {
			if (typeof element.id === 'string') {
				this.id = element.id;
				this.id = this.id.replace(/:/g, '\\:');
			}
		}

		for (let i = 0; i < element.classList.length; i++) {
			let cclass = element.classList[i];
			if (ignoredClasses.indexOf(cclass) === -1) {
				cclass = cclass.replace(/:/g, '\\:');
				this.classes.push(cclass);
			}
		}
	}

	getCssSelector(isFirstSelector) {
		if (isFirstSelector === undefined) {
			isFirstSelector = false;
		}

		let selector = this.tag;
		if (this.id !== null) {
			selector += `#${this.id}`;
		}
		if (this.classes.length) {
			for (let i = 0; i < this.classes.length; i++) {
				selector += `.${this.classes[i]}`;
			}
		}
		if (this.index !== null) {
			selector += `:nth-of-type(${this.index})`;
		}
		if (this.indexn !== null && this.indexn !== -1) {
			selector += `:nth-of-type(n+${this.indexn})`;
		}
		if (this.isDirectChild && isFirstSelector === false) {
			selector = `> ${selector}`;
		}

		return selector;
	}

	// merges this selector with another one.
	merge(mergeSelector) {
		if (this.tag !== mergeSelector.tag) {
			throw 'different element selected (tag)';
		}

		if (this.index !== null) {
			if (this.index !== mergeSelector.index) {
				// use indexn only for two elements
				if (this.indexn === null) {
					const indexn = Math.min(mergeSelector.index, this.index);
					if (indexn > 1) {
						this.indexn = Math.min(mergeSelector.index, this.index);
					}
				} else {
					this.indexn = -1;
				}

				this.index = null;
			}
		}

		if (this.isDirectChild === true) {
			this.isDirectChild = mergeSelector.isDirectChild;
		}

		if (this.id !== null) {
			if (this.id !== mergeSelector.id) {
				this.id = null;
			}
		}

		if (this.classes.length !== 0) {
			const classes = [];

			for (const i in this.classes) {
				const cclass = this.classes[i];
				if (mergeSelector.classes.indexOf(cclass) !== -1) {
					classes.push(cclass);
				}
			}

			this.classes = classes;
		}
	}
}
