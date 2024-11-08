const whois = require('whois');

async function lookupWhois(host) {
	return new Promise((resolve, reject) => {
		whois.lookup(host, function (err, data) {
			if (err) reject(err);
			resolve(data);
		});
	});
}

module.exports = { lookupWhois };
