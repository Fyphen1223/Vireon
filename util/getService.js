const net = require('net');
const tls = require('tls');

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

		sslSocket.setTimeout(2000);
		sslSocket.on('timeout', () => {
			sslSocket.destroy();
			resolve(false);
		});
	});
}
async function getSSH(port, host) {
	//check if SSH protocol is working
}

async function getHTTP(port, host) {
	return new Promise((resolve) => {
		const httpSocket = new net.Socket();
		httpSocket.setTimeout(2000);
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

async function getUniqueProtocol(port, host) {
	return await Promise.race([getSSL(port, host), getHTTP(port, host)]);
}

async function getService(host, port) {
	const isUnique = await getUniqueProtocol(port, host);
	if (isUnique) {
		return {
			header: parseHeader(isUnique),
			raw: trimResponse(isUnique),
		};
	}
	return new Promise(async (resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(2000);
		socket.on('data', (data) => {
			const banner = data.toString();
			socket.destroy();
			resolve({ headers: parseHeader(banner), raw: trimResponse(banner) });
		});

		socket.on('timeout', () => {
			socket.destroy();
			resolve('No response');
		});

		socket.on('error', (err) => {
			socket.destroy();
			resolve('No response');
		});

		socket.connect(port, host, () => {
			socket.write('\n');
			//socket.write('GET / HTTP/1.1\r\n\r\n');
		});
	});
}

function trimResponse(response) {
	return response.substring(0, 2000);
}

module.exports = { services, getService };
