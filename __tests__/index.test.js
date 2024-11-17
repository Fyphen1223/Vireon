const { test, expect } = require('@jest/globals');
const { test, expect, beforeAll, afterAll } = require('@jest/globals');
const { Client } = require('@elastic/elasticsearch');
const config = require('../config.json');

test('hello world!', () => {
	expect(1 + 1).toBe(2);
});
const client = new Client({
	node: 'https://localhost:9200',
	auth: {
		username: 'elastic',
		password: config.password,
	},
});

beforeAll(async () => {
	await client.indices.create({
		index: 'vireontest',
		body: {
			mappings: {
				properties: {
					ip: { type: 'ip' },
					ports: { type: 'integer' },
					service: { type: 'object' },
					time: { type: 'date' },
					whois: { type: 'text' },
					geo: {
						type: 'object',
						properties: {
							range: { type: 'long' },
							country: { type: 'text' },
							region: { type: 'text' },
							eu: { type: 'boolean' },
							timezone: { type: 'text' },
							city: { type: 'text' },
							ll: { type: 'geo_point' },
							metro: { type: 'integer' },
							area: { type: 'integer' },
						},
					},
					reversedDNS: { type: 'text' },
				},
			},
		},
	});
});

afterAll(async () => {
	await client.indices.delete({ index: 'vireontest' });
});

test('Elasticsearch index creation', async () => {
	const indices = await client.cat.indices({ index: 'vireontest' });
	expect(indices).toBeDefined();
});

test('Elasticsearch document indexing', async () => {
	const doc = {
		ip: '127.0.0.1',
		ports: 80,
		service: { name: 'http' },
		time: new Date(),
		whois: 'localhost',
		geo: {
			range: 12345,
			country: 'US',
			region: 'CA',
			eu: false,
			timezone: 'PST',
			city: 'San Francisco',
			ll: [37.7749, -122.4194],
			metro: 807,
			area: 123,
		},
		reversedDNS: 'localhost',
	};

	await client.index({
		index: 'vireontest',
		document: doc,
	});

	const result = await client.search({
		index: 'vireontest',
		body: {
			query: {
				match: { ip: '127.0.0.1' },
			},
		},
	});

	expect(result.hits.hits.length).toBeGreaterThan(0);
	expect(result.hits.hits[0]._source.ip).toBe('127.0.0.1');
});
