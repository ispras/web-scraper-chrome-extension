import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';

export default class Translator {
	static translatePage() {
		['title', 'data-i18n', 'placeholder'].forEach(attribute => this.translateAttribute(attribute));
	}
	static translateAttribute(attribute = 'data-i18n') {
		let selector = '[' + attribute + ']';
		$(selector).each((_, elem) => {
			let messageKey = $(elem).attr(attribute);
			if (selector === '[data-i18n]') {
				$(elem).html(this.getTranslationByKey(messageKey));
			} else {
				$(elem).attr(attribute, this.getTranslationByKey(messageKey));
			}
		});
	}
	static getTranslationByKey(element) {
		return $.i18n(element);
	}

	static initLocal(locale) {
		this.getTranslationByKey({
			locale: locale,
		});
		return this.getTranslationByKey().load('../i18n/locales.json');
	}
}
