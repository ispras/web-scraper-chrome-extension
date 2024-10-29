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
