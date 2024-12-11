import whois from 'whois';

export async function lookupWhois(host) {
	return new Promise((resolve, reject) => {
		whois.lookup(host, function (err, data) {
			if (err) reject(err);
			resolve(data);
		});
	});
}

export default { lookupWhois };
