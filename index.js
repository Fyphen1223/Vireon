const fs = require('fs');

const { scanPort } = require('./util/scanPort');
const { getService } = require('./util/getService');

const { lookupDNS } = require('./util/dns');
const { formatResult } = require('./util/formatResult');

async function main() {
	const host = 'energy-kyoiku.meti.go.jp';
	const ip = await lookupDNS(host);
	if (!ip) {
		console.log('Invalid host');
		return;
	}
	console.log(`IP address of ${host} is ${ip}`);
	const result = await scanPort(ip);
	console.log(result);

	let toBeWritten = [];
	await Promise.all(
		result.map(async (ports) => {
			toBeWritten.push({
				port: ports.port,
				service: await getService(ip, ports),
			});
		})
	);

	const finalResult = await formatResult(ip, result, toBeWritten);
	fs.writeFileSync('output.json', JSON.stringify(finalResult, null, 4));
}

main();

async function scan(host) {
	const ip = await lookupDNS(host);
	if (!ip) {
		console.log('Invalid host');
		return;
	}
	console.log(`IP address of ${host} is ${ip}`);
	const result = await scanPort(ip);

	let toBeWritten = [];
	await Promise.all(
		result.map(async (ports) => {
			toBeWritten.push({
				port: ports.port,
				service: await getService(ip, ports),
			});
		})
	);
	return formatResult(ip, result, toBeWritten);
	//elasticSearchにpush
}

async function sub() {
	const ipList = [];
	console.time('scan');
	for (let i = 0; i < 50; i++) {
		ipList.push(
			Math.floor(Math.random() * 256) +
				'.' +
				Math.floor(Math.random() * 256) +
				'.' +
				Math.floor(Math.random() * 256) +
				'.' +
				Math.floor(Math.random() * 256)
		);
	}
	await Promise.all(
		ipList.map(async (ip) => {
			console.log(await scan(ip));
		})
	);
	console.timeEnd('scan');
}

//sub();
