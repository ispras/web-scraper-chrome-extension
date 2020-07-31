import * as browser from 'webextension-polyfill';

export default class Translator {
	static translatePage() {
		['title', 'data-i18n', 'placeholder'].forEach(attribute =>
			this.translateAttribute(attribute)
		);
	}

	static translateAttribute(attribute = 'data-i18n') {
		let selector = '[' + attribute + ']';
		$(selector).each((_, elem) => {
			let messageKey = $(elem).attr(attribute);
			try {
				if (selector === '[data-i18n]') {
					$(elem).html(this.getTranslationByKey(messageKey));
				} else {
					$(elem).attr(attribute, this.getTranslationByKey(messageKey));
				}
			} catch (e) {
				$(elem).attr(attribute, messageKey);
			}
		});
	}

	static getTranslationByKey(element) {
		return browser.i18n.getMessage(element);
	}
}
