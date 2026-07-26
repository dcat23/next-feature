import { spawnSync } from 'child_process';

export function runShadcnCli(cwd: string, args: string): { success: boolean } {
  const parsedArgs = args.split(' ').filter(Boolean);

  const result = spawnSync('npx', ['shadcn@latest', ...parsedArgs], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return { success: result.status === 0 };
}
