import * as browser from 'webextension-polyfill';
import Translator from '../scripts/Translator';

$(() => {
	Translator.initLocale().then(() => {
		Translator.translatePage();
	});
});
