import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';
import * as browser from 'webextension-polyfill';

export default class Translator {
	static translatePage() {
		['title', 'data-i18n', 'placeholder'].forEach(attribute => this.translateAttribute(attribute));
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
		return $.i18n(element);
	}

	static initLocale() {
		return browser.runtime.sendMessage({ getLocale: true }).then(locale => {
			this.getTranslationByKey({
				locale: locale,
			});
			$.i18n()
				.load('../i18n/locales.json')
				.promise();
		});
	}
}
