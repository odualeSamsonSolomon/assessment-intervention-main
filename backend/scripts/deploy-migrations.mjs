import { execFileSync } from 'node:child_process';

if (process.env.VERCEL_ENV === 'production') {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(command, ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
}
