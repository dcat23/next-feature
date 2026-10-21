import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync, rmSync } from 'fs';
// pnpm 11 fails installs on unapproved dependency build scripts (e.g. nx's
// postinstall), which the generated test workspace doesn't approve
process.env.pnpm_config_strict_dep_builds = 'false';
describe('next-feature', () => {
  let projectDirectory: string;
  beforeAll(() => {
    projectDirectory = createTestProject();
    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`pnpm add -D next-feature@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });
  afterAll(() => {
    if (projectDirectory) {
      // Cleanup the test project
      rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('pnpm ls --depth 100 next-feature', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });
});
/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);
  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });
  // Match the workspace's Nx version so the plugin's peer deps line up, and skip
  // git: tmp/ is gitignored by this repo, which breaks create-nx-workspace's git add
  const { version: nxVersion } = require('nx/package.json');
  execSync(
    `pnpm dlx create-nx-workspace@${nxVersion} ${projectName} --preset apps --nxCloud=skip --skipGit --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);
  return projectDirectory;
}
