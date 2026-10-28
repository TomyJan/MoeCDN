import { createServer } from 'vite';
import { prepare } from './prepare.ts';
await prepare();
const server = await createServer();
await server.listen();
server.printUrls();
