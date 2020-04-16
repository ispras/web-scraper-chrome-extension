import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';
import * as browser from 'webextension-polyfill';
export default class Translator {
	static translatePage() {
		$('[data-i18n]').each(function() {
			let messageKey = $(this).attr('data-i18n');
			$(this).html($.i18n(messageKey));
		});
		($('[placeholder]') || $('[title]')).each(function() {
			let messageKey = $(this).attr('data-i18n');
			$(this).html($.i18n(messageKey));
			let placeholderKey = $(this).attr('placeholder');
			$(this).attr('placeholder', $.i18n(placeholderKey));
			let titleKey = $(this).attr('title');
			$(this).attr('title', $.i18n(titleKey));
		});

		// $('[title]').each(function() {
		// 	let titleKey = $(this).attr('title');
		// 	$(this).attr('title', $.i18n(titleKey));
		// });
	}
	static translateElement(element) {
		return $.i18n(element);
	}

	static initLocal(locale) {
		this.translateElement({
			locale: locale,
		});
		return this.translateElement().load('../i18n/locales.json');
	}
}
