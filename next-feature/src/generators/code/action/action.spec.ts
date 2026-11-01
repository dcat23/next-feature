import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addProjectConfiguration, readProjectConfiguration } from '@nx/devkit';
import { actionGenerator } from './action';
import { ActionGeneratorSchema } from './schema';
describe('action generator', () => {
  let tree: Tree;
  const options: ActionGeneratorSchema = {
    name: 'test',
    actionType: 'api',
    projectName: 'test',
  };
  const read = (file: string) => tree.read(file, 'utf-8') ?? '';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });
  it('should run successfully', async () => {
    await actionGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  describe('server/client boundaries', () => {
    it('should write a server-only action without a use server directive', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', skipFormat: true });
      const buffer = read('features/base/src/lib/actions/user.ts');
      expect(buffer.startsWith("import 'server-only';")).toBeTruthy();
      expect(buffer).not.toContain("'use server'");
      expect(buffer).toContain("import { withApi } from '@next-feature/client/server';");
      expect(buffer).toContain("import { type GetUsersRequest, type GetUsersResponse } from '../types/user';");
      expect(buffer).toContain('export const getUsers = withApi(');
    });

    it('should write the request/response contract to the data-type location', async () => {
      await actionGenerator(tree, { name: 'createUser', actionType: 'api', projectName: 'base', skipFormat: true });
      const buffer = read('features/base/src/lib/types/user.ts');
      expect(buffer).toContain("import { z } from 'zod';");
      expect(buffer).toContain('export const createUserSchema = z.object({});');
      expect(buffer).toContain('export type CreateUserRequest = z.infer<typeof createUserSchema>;');
      expect(buffer).toContain('export type CreateUserResponse = {};');
      expect(buffer).not.toContain('server-only');
      expect(read('features/base/src/lib/actions/user.ts')).toContain(
        "import { createUserSchema, type CreateUserRequest, type CreateUserResponse } from '../types/user';"
      );
    });

    it('should merge contract imports when appending actions to the same file', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', skipFormat: true });
      await actionGenerator(tree, { name: 'createUser', actionType: 'api', projectName: 'base', skipFormat: true });
      const buffer = read('features/base/src/lib/actions/user.ts');
      expect(buffer.match(/from '\.\.\/types\/user'/g)).toHaveLength(1);
      expect(buffer).toContain('createUserSchema');
      expect(buffer).toContain('type GetUsersResponse');
      expect(read('features/base/src/lib/types/user.ts').match(/from 'zod'/g)).toHaveLength(1);
    });

    it('should not generate use server wrappers by default', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', skipFormat: true });
      expect(tree.exists('features/base/src/lib/actions/user.action.ts')).toBeFalsy();
      expect(tree.exists('features/base/src/lib/actions/user.form.ts')).toBeFalsy();
    });

    it('should generate a use server wrapper when useHook is set', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', useHook: true, skipFormat: true });
      const buffer = read('features/base/src/lib/actions/user.action.ts');
      expect(buffer.startsWith("'use server';")).toBeTruthy();
      expect(buffer).toContain("import { getUsers } from './user';");
      expect(buffer).toContain("import { type GetUsersRequest } from '../types/user';");
      expect(buffer).toContain('export async function getUsersAction(options?: GetUsersRequest)');
    });

    it('should generate a use server form action for form actions', async () => {
      await actionGenerator(tree, { name: 'createFeedback', actionType: 'form', projectName: 'base', skipFormat: true });
      const server = read('features/base/src/lib/actions/feedback.ts');
      expect(server.startsWith("import 'server-only';")).toBeTruthy();
      expect(server).not.toContain('withForm');

      const form = read('features/base/src/lib/actions/feedback.form.ts');
      expect(form.startsWith("'use server';")).toBeTruthy();
      expect(form).toContain("import { withForm } from '@next-feature/client/server';");
      expect(form).toContain("import { createFeedback } from './feedback';");
      expect(form).toContain('export const createFeedbackFormAction = withForm(');
      expect(tree.exists('features/base/src/lib/actions/feedback.action.ts')).toBeFalsy();
    });

    it('should honor the file option for all generated files', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', file: 'account', useHook: true, skipFormat: true });
      expect(tree.exists('features/base/src/lib/actions/account.ts')).toBeTruthy();
      expect(tree.exists('features/base/src/lib/actions/account.action.ts')).toBeTruthy();
      expect(tree.exists('features/base/src/lib/types/account.ts')).toBeTruthy();
    });

    it('should use the configured clientPackage for withApi', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', clientPackage: '@myorg/client', skipFormat: true });
      expect(read('features/base/src/lib/actions/user.ts')).toContain("from '@myorg/client/server'");
    });
  });

  describe('export', () => {
    it('should export the contract from index and the action from server in a library', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', useHook: true, export: true, skipFormat: true });
      expect(read('features/base/src/index.ts')).toContain("export * from './lib/types/user';");
      const server = read('features/base/src/server.ts');
      expect(server).toContain("import 'server-only';");
      expect(server).toContain("export * from './lib/actions/user';");
      expect(server).not.toContain('user.action');
    });

    it('should not export from an application', async () => {
      addProjectConfiguration(tree, 'web', { root: 'apps/web', sourceRoot: 'apps/web/src', projectType: 'application' });
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'web', export: true, skipFormat: true });
      expect(tree.exists('apps/web/src/lib/actions/user.ts')).toBeTruthy();
      expect(tree.exists('apps/web/src/index.ts')).toBeFalsy();
      expect(tree.exists('apps/web/src/server.ts')).toBeFalsy();
    });
  });

  it('should chain the hook generator when useHook is set', async () => {
    await actionGenerator(tree, {
      name: 'getUsers',
      actionType: 'api',
      projectName: 'base',
      useHook: true,
    });
    const hookFile = 'features/base/src/hooks/use-get-users.ts';
    const buffer = tree.read(hookFile, 'utf-8') ?? '';
    expect(tree.exists(hookFile)).toBeTruthy();
    expect(buffer.includes('useQuery')).toBeTruthy();
    expect(buffer.includes(`from '../lib/actions/user.action'`)).toBeTruthy();
    expect(buffer.includes(`from '../lib/types/user'`)).toBeTruthy();
  });

  it('should place useTypes declarations in the contract file', async () => {
    await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', useTypes: true, skipFormat: true });
    const buffer = read('features/base/src/lib/types/user.ts');
    expect(buffer).toContain('export interface User');
    expect(buffer).toContain('export type GetUsersResponse');
  });

  it('should import the mapper generated by useMapper', async () => {
    await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', useMapper: true, skipFormat: true });
    const action = read('features/base/src/lib/actions/user.ts');
    expect(action).toContain("import { mapToGetUsers } from '../utils/user';");
    expect(action).toContain('return mapToGetUsers(response);');
    expect(read('features/base/src/lib/utils/user.ts')).toContain('export function mapToGetUsers');
  });

  it('should not chain the hook generator for form actions', async () => {
    await actionGenerator(tree, {
      name: 'submitFeedback',
      actionType: 'form',
      projectName: 'base',
      useHook: true,
    });
    const hookFile = 'features/base/src/hooks/use-submit-feedback.ts';
    expect(tree.exists(hookFile)).toBeFalsy();
  });

  it('should reject the removed db action type', () => {
    const schema = require('./schema.json');
    expect(schema.properties.actionType.enum).toEqual(['api', 'form']);
  });

  describe('api clients', () => {
    it('should call the default client by default', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', skipFormat: true });
      const action = read('features/base/src/lib/actions/user.ts');
      expect(action).toContain("import api from '../config/client';");
      expect(action).toContain('await api.get<GetUsersResponse>(');
      expect(read('features/base/src/lib/config/client.ts')).toContain('export default api;');
    });

    it('should resolve the config import from a custom package', async () => {
      await actionGenerator(tree, { name: 'getUsers', actionType: 'api', projectName: 'base', package: 'actions', skipFormat: true });
      expect(read('features/base/src/actions/user.ts')).toContain("import api from '../lib/config/client';");

      await actionGenerator(tree, { name: 'getOrders', actionType: 'api', projectName: 'base', package: 'lib/actions/orders', skipFormat: true });
      expect(read('features/base/src/lib/actions/orders/order.ts')).toContain("import api from '../../config/client';");
    });

    it('should import and call a named client, creating it if missing', async () => {
      await actionGenerator(tree, { name: 'getPayments', actionType: 'api', projectName: 'base', apiClient: 'payments', skipFormat: true });
      const action = read('features/base/src/lib/actions/payment.ts');
      expect(action).toContain("import { payments } from '../config/client';");
      expect(action).not.toContain('import api from');
      expect(action).toContain('await payments.get<GetPaymentsResponse>(');
      expect(read('features/base/src/lib/config/client.ts')).toContain('export const payments = new ApiClient({');
    });

    it('should import each client when actions sharing a file call different clients', async () => {
      await actionGenerator(tree, { name: 'getPayments', actionType: 'api', projectName: 'base', file: 'billing', apiClient: 'payments', skipFormat: true });
      await actionGenerator(tree, { name: 'getInvoices', actionType: 'api', projectName: 'base', file: 'billing', skipFormat: true });
      const action = read('features/base/src/lib/actions/billing.ts');
      expect(action).toContain("import api, { payments } from '../config/client';");
      expect(action.match(/from '\.\.\/config\/client'/g)).toHaveLength(1);
      expect(action).toContain('await api.get<GetInvoicesResponse>(');
    });
  });
});
