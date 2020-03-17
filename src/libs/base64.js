/**
 * @url http://jsperf.com/blob-base64-conversion
 */
export default class Base64 {
	static blobToBase64(blob) {
		var deferredResponse = $.Deferred();
		var reader = new FileReader();
		reader.onload = function() {
			var dataUrl = reader.result;
			var base64 = dataUrl.split(',')[1];
			deferredResponse.resolve(base64);
		};
		reader.readAsDataURL(blob);
		return deferredResponse.promise();
	}

	static base64ToBlob(base64, mimeType) {
		var deferredResponse = $.Deferred();
		var binary = atob(base64);
		var len = binary.length;
		var buffer = new ArrayBuffer(len);
		var view = new Uint8Array(buffer);
		for (var i = 0; i < len; i++) {
			view[i] = binary.charCodeAt(i);
		}
		var blob = new Blob([view], { type: mimeType });
		deferredResponse.resolve(blob);
		return deferredResponse.promise();
	}
}
