export function parseHeader(header) {
	const headers = {};
	const lines = header.split('\r\n');

	lines.forEach((line) => {
		const [key, value] = line.split(': ');
		if (key && value) {
			headers[key] = value;
		}
	});
	return headers;
}

export default { parseHeader };
