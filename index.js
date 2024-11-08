const fs = require('fs');

const { scanPort } = require('./util/scanPort');
const { getService } = require('./util/getService');

const { lookupDNS } = require('./util/dns');
const { formatResult } = require('./util/formatResult');

async function main() {
	const host = 'letsreserve.ddns.net';
	const ip = await lookupDNS(host);
	console.log(`IP address of ${host} is ${ip}`);
	const result = await scanPort(ip);
	console.log(result);

	let toBeWritten = [];
	await Promise.all(
		result.map(async (ports) => {
			toBeWritten.push({
				port: ports.port,
				service: await getService(ip, ports.port),
			});
		})
	);

	const finalResult = await formatResult(ip, result, toBeWritten);
	fs.writeFileSync('output.json', JSON.stringify(finalResult, null, 4));
}

main();
