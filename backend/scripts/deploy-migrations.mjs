import { execFileSync } from 'node:child_process';

const isProduction = process.env.VERCEL_ENV === 'production';
const isOptedInPreview = process.env.VERCEL_ENV === 'preview'
  && process.env.RUN_PREVIEW_MIGRATIONS === 'true';

if (isProduction || isOptedInPreview) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(command, ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
}
