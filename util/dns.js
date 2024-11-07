const dns = require('dns');

async function lookupDNS(host) {
	return new Promise((resolve) => {
		dns.lookup(host, (err, address) => {
			if (err) {
				resolve();
			} else {
				resolve(address);
			}
		});
	});
}

async function reverseDNS(ip) {
	return new Promise((resolve) => {
		dns.reverse(ip, (err, hostnames) => {
			if (err) {
				resolve();
			} else {
				resolve(hostnames);
			}
		});
	});
}

module.exports = { lookupDNS, reverseDNS };
