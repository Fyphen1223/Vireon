const { scanPort } = require('./util/scanPort');
const { getService } = require('./util/getService');

const { lookupDNS } = require('./util/dns');

async function main() {
	const host = '80.172.227.3';
	const ip = await lookupDNS(host);
	console.log(`IP address of ${host} is ${ip}`);
	const result = await scanPort(ip);
	console.log(result);

	await Promise.all(
		result.map(async (ports) => {
			console.log(ports.port, await getService(ip, ports.port));
		})
	);
}

main();
