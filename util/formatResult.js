const net = require('net');

const whois = require('whois');
const geoip = require('geoip-lite');

const { reverseDNS } = require('./dns');
const { lookupWhois } = require('./whois');
const { lookup } = require('dns');

async function formatResult(ip, port, service) {
	let actualports = [];
	port.forEach((port) => {
		actualports.push(port.port);
	});
	return {
		ip,
		ports: actualports,
		service,
		time: new Date().toUTCString(),
		whois: await lookupWhois(ip),
		geo: geoip.lookup(ip),
		reversedDNS: await reverseDNS(ip),
	};
}

module.exports = { formatResult };
