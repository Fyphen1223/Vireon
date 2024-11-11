const net = require('net');
const tls = require('tls');
const ssh2 = require('ssh2');
const ws = require('ws');

const { parseHeader } = require('./parseHeader');

const services = {
	21: 'FTP',
	22: 'SSH',
	23: 'Telnet',
	25: 'SMTP',
	53: 'DNS',
	80: 'HTTP',
	110: 'POP3',
	143: 'IMAP',
	443: 'HTTPS',
	3306: 'MySQL',
	5432: 'PostgreSQL',
	6379: 'Redis',
	27017: 'MongoDB',
};

async function getSSL(port, host) {
	return new Promise((resolve) => {
		const sslSocket = tls.connect(
			port,
			host,
			{ rejectUnauthorized: false, timeout: 2000 },
			() => {
				sslSocket.write('HEAD / HTTP/1.1\r\nHost: ' + host + '\r\n\r\n');
			}
		);

		sslSocket.on('data', (data) => {
			const content = data.toString();
			sslSocket.end();
			resolve(content);
		});

		sslSocket.on('error', () => {
			sslSocket.destroy();
			resolve(false);
		});

		sslSocket.setTimeout(3000);
		sslSocket.on('timeout', () => {
			sslSocket.destroy();
			resolve(false);
		});
	});
}
/*
async function getSSH(port, host) {
	return new Promise((resolve, reject) => {
		const socket = new net.Socket();
		socket.setTimeout(5000);

		socket.on('data', (data) => {
			socket.end();
			resolve(data.toString());
			console.log(data);
		});
		socket.on('connect', () => {
			socket.end();
			resolve(true);
		});

		socket.on('timeout', () => {
			socket.destroy();
			resolve(false);
		});

		socket.on('error', (err) => {
			resolve(false);
		});
		socket.connect(port, host);
	});
}
*/

async function getHTTP(port, host) {
	return new Promise((resolve) => {
		const httpSocket = new net.Socket();
		httpSocket.setTimeout(3000);
		httpSocket.on('data', (data) => {
			const content = data.toString();
			httpSocket.destroy();
			resolve(content);
		});

		httpSocket.on('timeout', () => {
			httpSocket.destroy();
			resolve(false);
		});

		httpSocket.on('error', () => {
			httpSocket.destroy();
			resolve(false);
		});

		httpSocket.connect(port, host, () => {
			httpSocket.write('HEAD / HTTP/1.1\r\nHost: ' + host + '\r\n\r\n');
		});
	});
}

async function getWS(port, host) {
	return new Promise((resolve) => {
		const wsSocket = new ws(`ws://${host}:${port}`);
		wsSocket.on('open', () => {
			resolve(true);
		});
		wsSocket.on('data', (data) => {
			resolve(data.toString());
		});
		wsSocket.on('error', () => {
			resolve(false);
		});
	});
}

async function getUniqueProtocol(port, host) {
	return await Promise.race([
		getSSL(port, host),
		//getHTTP(port, host),
		//getSSH(port, host),
	]);
}

async function getService(host, ports) {
	const isUnique = await getUniqueProtocol(ports.port, host);
	if (isUnique) {
		return {
			headers: parseHeader(isUnique),
			raw: trimResponse(isUnique),
			protocol: ports.protocol,
		};
	}
	return new Promise(async (resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(3000);
		socket.on('data', (data) => {
			const banner = data.toString();
			socket.destroy();
			resolve({
				headers: parseHeader(banner),
				raw: trimResponse(banner),
				protocol: ports.protocol,
			});
		});

		socket.on('timeout', () => {
			socket.destroy();
			resolve({
				headers: { error: 'No response' },
				raw: 'No response',
				protocol: ports.protocol,
			});
		});

		socket.on('error', (err) => {
			socket.destroy();
			resolve({
				headers: { error: 'No response' },
				raw: 'No response',
				protocol: ports.protocol,
			});
		});

		socket.connect(ports.port, host, () => {
			//socket.write('\r\n');
			socket.write('GET / HTTP/1.1\r\n\r\n');
		});
	});
}

function trimResponse(response) {
	return response.substring(0, 3000);
}

module.exports = { services, getService };
