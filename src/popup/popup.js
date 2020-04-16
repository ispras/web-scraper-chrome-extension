import * as browser from 'webextension-polyfill';
import Translator from '../scripts/Translator';

$(() => {
	browser.runtime.sendMessage({ getLocale: true }).then(locale => {
		Translator.initLocal(locale);
		Translator.translateElement()
			.load(Translator.localePath())
			.promise()
			.then(() => {
				Translator.translatePage();
			});
	});
});
