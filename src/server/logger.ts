export type ErrorData = { [k: string]: number | string | boolean | ErrorData } | (number | string | boolean | ErrorData)[];
let errorNumber = 0;
function blError(description: string, data?: ErrorData) {
	errorNumber++;
	console.error(`Browser Lightboard Error #${errorNumber}: "${description}"`);
	if (data)
		console.error(
			`BL Error #${errorNumber} data: "${JSON.stringify(data)}"`
		);
}
function blBrowserError(description: string, data?: ErrorData) {
	errorNumber++;
	console.error(`Browser Lightboard Browser Error #${errorNumber}: "${description}"`);
	if (data)
		console.error(
			`BL Error #${errorNumber} data: "${JSON.stringify(data)}"`
		);
}

export const blLog = {error: blError, browserError: blBrowserError};