/**
 * @url http://jsperf.com/blob-base64-conversion
 */
export default class Base64 {
	static blobToBase64(blob) {
		return new Promise((resolve, reject) => {
			let reader = new FileReader();
			reader.onload = () => {
				let dataUrl = reader.result;
				let base64 = dataUrl.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	static base64ToBlob(base64, mimeType) {
		return new Promise(resolve => {
			let binary = atob(base64);
			let blobPart = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				blobPart[i] = binary.charCodeAt(i);
			}
			let blob = new Blob([blobPart], { type: mimeType });
			resolve(blob);
		});
	}
}
