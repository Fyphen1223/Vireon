const { reverseDNS } = require('./util/dns');

async function main() {
	const hostnames = await reverseDNS('138.2.60.125');
	console.log(hostnames);
}

main();
