import dns from 'dns';

export async function lookupDNS(host) {
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

export async function reverseDNS(ip) {
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

export default { lookupDNS, reverseDNS };
