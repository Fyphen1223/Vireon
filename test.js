import { scanPort } from './util/scanPort.js';

async function main() {
	console.log(await scanPort('1.1.1.1', []));
}

main();
