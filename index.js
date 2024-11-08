process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const config = require('./config.json');

const fs = require('fs');

const { scanPort } = require('./util/scanPort');
const { getService } = require('./util/getService');

const { lookupDNS } = require('./util/dns');
const { formatResult } = require('./util/formatResult');

const { Client } = require('@elastic/elasticsearch');
const client = new Client({
	node: 'https://localhost:9200',
	auth: {
		username: 'elastic',
		password: config.password,
	},
});

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

//main();

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
	console.log(await formatResult(ip, result, toBeWritten));
	await client.index({
		index: 'vireontest',
		document: await formatResult(ip, result, toBeWritten),
	});
	return;
}

async function sub() {
	try {
		indices = await client.cat.indices({ index: 'vireontest' });
	} catch (err) {
		console.log('Index does not exist');
		await client.indices.create({
			index: 'vireontest',
			body: {
				mappings: {
					properties: {
						ip: {
							type: 'ip',
						},
						ports: {
							type: 'integer',
						},
						service: {
							type: 'object',
						},
						time: {
							type: 'date',
						},
						whois: {
							type: 'text',
						},
						geo: {
							type: 'object',
							properties: {
								range: {
									type: 'long',
								},
								country: {
									type: 'text',
								},
								region: {
									type: 'text',
								},
								eu: {
									type: 'boolean',
								},
								timezone: {
									type: 'text',
								},
								city: {
									type: 'text',
								},
								ll: {
									type: 'geo_point',
								},
								metro: {
									type: 'integer',
								},
								area: {
									type: 'integer',
								},
							},
						},
						reversedDNS: {
							type: 'keyword',
						},
					},
				},
			},
		});
	}
	const ipList = [];
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
	do {
		const scanList = ipList.splice(0, 10);
		await Promise.all(scanList.map(async (ip) => await scan(ip)));
	} while (ipList.length > 0);
}

sub();

async function test() {
	await client.indices.delete({
		index: 'vireontest',
	});
	await client.indices.create({
		index: 'vireontest',
		body: {
			mappings: {
				dynamic: true,
				properties: {
					ip: {
						type: 'ip',
					},
					ports: {
						type: 'integer',
					},
					services: {
						type: 'nested',
						properties: {
							port: {
								type: 'integer',
							},
							service: {
								type: 'object',
								properties: {
									headers: {
										type: 'object',
									},
									raw: {
										type: 'keyword',
									},
									protocol: {
										type: 'text',
									},
								},
							},
						},
					},
					time: {
						type: 'text',
					},
					whois: {
						type: 'keyword',
					},
					geo: {
						type: 'object',
						properties: {
							range: {
								type: 'long',
							},
							country: {
								type: 'text',
							},
							region: {
								type: 'text',
							},
							eu: {
								type: 'text',
							},
							timezone: {
								type: 'text',
							},
							city: {
								type: 'text',
							},
							ll: {
								type: 'text',
							},
							metro: {
								type: 'integer',
							},
							area: {
								type: 'integer',
							},
						},
					},
					reversedDNS: {
						type: 'keyword',
					},
				},
			},
		},
	});
	await sub();
}
//test();

async function search() {
	const res = await client.search({
		index: 'vireontest',
		body: {
			query: {
				match_all: {},
			},
		},
	});

	const data = await client.get({
		index: 'vireontest',
		id: res.hits.hits[0]._id,
	});
	//actual data is in data._source

	console.log(data._source);
}

//search();

process.on('uncaughtException', (err) => {
	console.log(err);
});
