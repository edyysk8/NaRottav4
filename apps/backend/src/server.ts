import './types/fastify.js';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './modules/realtime/socket.js';

const app = await buildApp();
const io = createSocketServer(app.server);
app.decorate('io', io);

await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(`NaRotta API online em http://${env.HOST}:${env.PORT}`);
