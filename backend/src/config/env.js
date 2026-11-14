import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '../..');

const parseList = (value, fallback) =>
  (value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Central environment configuration. API keys are read here only and never
 * returned to the React frontend.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT) || 5000,
  corsOrigins: parseList(process.env.CORS_ORIGINS, 'http://localhost:5173,http://127.0.0.1:5173'),
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(backendRoot, 'data'),
  // Optional narrative provider. 'none' keeps the rule-based engine as the only analysis layer.
  aiProvider: (process.env.AI_PROVIDER || 'none').trim().toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  backendRoot,
};
