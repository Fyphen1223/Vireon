import * as geoip from 'geoip-lite';

import reverseDNS from './dns.js';
import lookupWhois from './whois.js';

export async function formatResult(ip, port, service) {
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

export default { formatResult };
