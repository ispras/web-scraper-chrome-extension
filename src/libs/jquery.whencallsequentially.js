/**
 * @author Martins Balodis
 *
 * An alternative version of $.when which can be used to execute asynchronous
 * calls sequentially one after another.
 *
 * @returns $.Deferred().promise()
 */
$.whenCallSequentially = function (functionCalls) {
	let promiseChain = Promise.resolve([]);

	functionCalls.forEach(func => {
		promiseChain = promiseChain.then(resultData => {
			return func().then(data => {
				resultData.push(data);
				return resultData;
			});
		});
	});

	return promiseChain;
};
