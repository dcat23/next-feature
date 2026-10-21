import { NormalizedActionGeneratorSchema } from "../types"

/**
 * [contract-content]
 * Request schema and Request/Response types, written to the data-type
 * location (lib/types/<file>.ts) so client components can import them.
 */
export function contractContent(options: NormalizedActionGeneratorSchema) {
  const { hasRequestBody, schemaName, requestType, responseType } = options;
  return `
${hasRequestBody ? `export const ${schemaName} = z.object({});` : ""}
export type ${requestType} = ${hasRequestBody ? `z.infer<typeof ${schemaName}>;` : "{};"}
export type ${responseType} = {};
`
}

/**
 * [api-content]
 * Server-only action, callable from RSC, route handlers and other server code.
 */
export function apiContent(options: NormalizedActionGeneratorSchema) {
  const { hasRequestBody, schemaName, requestType, responseType } = options;
  const useApi = /(api|form)/.test(options.actionType);
  return`
export const ${options.methodName} = ${useApi ? "withApi" : ""}(async (options?: ${requestType}) => {
  ${hasRequestBody ? `const parsed = ${schemaName}.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }` : ""}

  ${!hasRequestBody ? `const params = new URLSearchParams();
  const endpoint = "/${options.endpoint}?" + params.toString();
  ` : `const endpoint = "/${options.endpoint}";`}
  const response = await api.${options.httpMethod}<${responseType}>(endpoint${hasRequestBody ? ", parsed.data" : ""});
  return ${options.useMapper ? `${options.mapperName}(response)` : "response"};
}${useApi ? ", {}": ""});
`
}

/**
 * [action-content]
 * 'use server' wrapper exposing the server-only action to client components.
 */
export function actionContent(options: NormalizedActionGeneratorSchema) {
  return `
export async function ${options.actionName}(options?: ${options.requestType}) {
  return ${options.methodName}(options);
}
`
}

/**
 * [form-content]
 * 'use server' form action for useActionState, parsing FormData into the request.
 */
export function formContent(options: NormalizedActionGeneratorSchema) {
  const formMapper = "parse" + options.requestType;
  return `
function ${formMapper}(formData: FormData): ${options.requestType} {
  return {};
}

export const ${options.formActionName} = withForm(async (formData: FormData) =>
  ${options.methodName}(${formMapper}(formData))
);
`
}
