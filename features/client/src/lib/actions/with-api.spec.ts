import { withApi } from './with-api';
import type { ApiResponse } from '../types';

jest.mock('server-only', () => ({}));

type Request = { id: string };
type Response = { name: string };

describe('withApi types', () => {
  it('infers the parameters and result of the wrapped function', async () => {
    const getUser = withApi(async (options?: Request) => ({ name: options?.id ?? '' }) as Response, {});
    const result: ApiResponse<Response> = await getUser({ id: 'a' });
    // @ts-expect-error the parameter type is kept
    getUser({ id: 1 });
    expect(result).toEqual({ success: true, message: 'success', data: { name: 'a' } });
  });
});
