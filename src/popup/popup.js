import * as $ from 'jquery';
import Translator from '../scripts/Translator';

$(() => {
	Translator.translatePage();
	$('.ws-version').append(chrome.app.getDetails().version);
});
