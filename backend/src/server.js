import { createApp } from './app.js';
import { env } from './config/env.js';
import { initialiseStorage } from './storage/jsonStorage.js';

async function start() {
  const report = await initialiseStorage();
  const created = report.filter((r) => r.status === 'created');
  console.log(`[storage] data directory: ${env.dataDir}`);
  if (created.length) console.log(`[storage] initialised missing file(s): ${created.map((r) => r.file).join(', ')}`);
  const broken = report.filter((r) => r.status === 'corrupted' || r.status === 'unreadable');
  if (broken.length) console.warn(`[storage] WARNING, these files need attention: ${broken.map((r) => `${r.file} (${r.status})`).join(', ')}`);

  const app = createApp();
  const server = app.listen(env.port, env.host, () => {
    console.log(`[api] Astronaut MSK monitoring API listening on http://${env.host}:${env.port}/api`);
    console.log(`[api] narrative provider: ${env.aiProvider === 'openai' && env.openaiApiKey ? 'openai (configured)' : 'none (rule-based analysis only)'}`);
  });

  const shutdown = () => {
    console.log('[api] shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[api] failed to start:', err.message);
  process.exit(1);
});
