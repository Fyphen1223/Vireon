const net = require('net');

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

async function getService(host, port) {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(2000);
		socket.on('data', (data) => {
			const banner = data.toString();
			socket.destroy();
			resolve(banner);
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
			socket.write('GET / HTTP/1.1\r\n\r\n');
		});
	});
}

module.exports = { services, getService };
