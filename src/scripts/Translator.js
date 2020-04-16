import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';
import * as browser from 'webextension-polyfill';
export default class Translator {
	constructor(options) {}
	static localePath() {
		return '../i18n/locales.json';
	}
	static translatePage() {
		$('[data-i18n]').each(function() {
			let messageKey = $(this).attr('data-i18n');
			if ($(this).text() !== $.i18n(messageKey)) {
				$(this).prepend($.i18n(messageKey));
			}
		});
		$('[placeholder]').each(function() {
			let placeholderKey = $(this).attr('placeholder');
			$(this).attr('placeholder', $.i18n(placeholderKey));
		});
	}
	static translateElement(element) {
		return $.i18n(element);
	}

	static initLocal(locale) {
		this.translateElement({
			locale: locale,
		});
	}
}
