import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json'));

import { scanPort } from './util/scanPort.js';
import {getService} from './util/getService.js';
import {lookupDNS} from './util/dns.js';
import {formatResult} from './util/formatResult.js';

import { Client } from '@elastic/elasticsearch';
const client = new Client({
	node: 'https://localhost:9200',
	auth: {
		username: 'elastic',
		password: config.password,
	},
});

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
	const isDuplicate = await client.search({
		index: 'vireontest',
		body: {
			query: {
				match: {
					ip: ip,
				},
			},
		},
	});
	if (isDuplicate.hits.hits.length > 0) {
		console.log(`Updating index: ${host}`);
		await client.update({
			index: 'vireontest',
			id: isDuplicate.hits.hits[0]._id,
			body: {
				doc: await formatResult(ip, result, toBeWritten),
			},
		});
	} else {
		console.log(`Writing to index: ${host}`);
		await client.index({
			index: 'vireontest',
			document: await formatResult(ip, result, toBeWritten),
		});
	}
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
							type: 'text',
						},
					},
				},
			},
		});
	}
	const ipList = [];
	for (let i = 0; i < 10000; i++) {
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
	let I = 0;
	do {
		const scanList = ipList.splice(0, 20);
		await Promise.all(
			scanList.map(async (ip) => {
				try {
					await scan(ip);
					I++;
					console.log(`Progress: ${I}/${ipList.length}`);
				} catch (err) {
					console.log(err);
				}
			})
		);
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
										type: 'text',
									},
									protocol: {
										type: 'keyword',
									},
								},
							},
						},
					},
					time: {
						type: 'text',
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
						type: 'text',
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
				match: {
					'services.service.port': 80,
				},
			},
		},
	});

	console.log(res.hits.hits.length);
}

//search();

process.on('uncaughtException', (err) => {
	console.log(err);
});
