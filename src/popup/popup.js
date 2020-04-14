import * as browser from 'webextension-polyfill';
import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';

function fillLocale() {
	$('[data-i18n]').each(function() {
		let messageKey = $(this).attr('data-i18n');
		$(this).html($.i18n(messageKey));
	});
	$('[placeholder]').each(function() {
		let placeholderKey = $(this).attr('placeholder');
		$(this).attr('placeholder', $.i18n(placeholderKey));
	});
}

$(() => {
	browser.runtime.sendMessage({ getLocale: true }).then(locale => {
		$.i18n({
			locale: locale,
		});
		$.i18n()
			.load('../i18n/locales.json')
			.promise()
			.then(() => {
				fillLocale();
			});
	});
});
