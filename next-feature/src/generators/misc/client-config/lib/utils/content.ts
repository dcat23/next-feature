import type { NormalizedClientConfigGeneratorSchema } from '../types';

/**
 * [client-content]
 * One named, configured ApiClient, appended to lib/config/client.ts.
 */
export function clientContent(
  options: NormalizedClientConfigGeneratorSchema & { envVar: string; userAgent: string }
) {
  const { clientName, envVar, userAgent } = options;
  return `
export const ${clientName} = new ApiClient({
  baseURL: ${envVar},
  // onAuthenticated: async (config) => {
  //   config.headers.Authorization = \`Bearer \${token}\`;
  // },
});
${clientName}.axios.defaults.headers.common['User-Agent'] = '${userAgent}';
`;
}

/** The project's first client is also the file's default export (used by actions). */
export function defaultExportContent(clientName: string) {
  return `
export default ${clientName};
`;
}
