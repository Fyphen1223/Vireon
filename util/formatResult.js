const geoip = require('geoip-lite');

const { reverseDNS } = require('./dns');
const { lookupWhois } = require('./whois');

async function formatResult(ip, port, service) {
	let actualports = [];
	port.forEach((port) => {
		actualports.push(port.port);
	});
	let reversed = await reverseDNS(ip);
	if (!reversed) reversed = 'No reverse DNS found';
	return {
		ip,
		ports: actualports,
		services: service,
		time: new Date().toUTCString(),
		whois: await lookupWhois(ip),
		geo: geoip.lookup(ip),
		reversedDNS: reversed,
	};
}

module.exports = { formatResult };
