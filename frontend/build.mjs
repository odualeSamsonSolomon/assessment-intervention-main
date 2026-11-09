import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const frontendDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(frontendDirectory, 'dist');
const configuredApiBase = process.env.AIT_API_BASE_URL?.trim();

if (process.env.VERCEL_ENV === 'preview' && !configuredApiBase) {
  throw new Error('AIT_API_BASE_URL must point to the Preview API for Vercel Preview builds.');
}

const apiBase = configuredApiBase || 'https://assessment-intervention-main.vercel.app/api';
const parsedApiBase = new URL(apiBase);
if (parsedApiBase.protocol !== 'https:' && parsedApiBase.hostname !== 'localhost' && parsedApiBase.hostname !== '127.0.0.1') {
  throw new Error('AIT_API_BASE_URL must use HTTPS outside local development.');
}

await mkdir(outputDirectory, { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) {
  await copyFile(join(frontendDirectory, file), join(outputDirectory, file));
}
await writeFile(
  join(outputDirectory, 'config.js'),
  `window.AIT_API_BASE_URL = ${JSON.stringify(apiBase)};\n`,
);
