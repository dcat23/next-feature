import { NormalizedActionGeneratorSchema } from "../types"

/**
 * [api-content]
 * next-feature@0.1.2-2
 * January 31st 2026, 2:17:33 pm
 */
export function apiContent(options: NormalizedActionGeneratorSchema) {
  const responseType = options.names.className + "Response";
  const requestType = options.names.className + "Request";
  const schema = options.names.propertyName + "Schema";
  return`
${options.hasRequestBody ? `const ${schema} = z.object({});` : ""}
export type ${requestType} = ${options.hasRequestBody ? `z.infer<typeof ${schema}>;` : "{};"}
export type ${responseType} = {};

export const ${options.methodName} = withApi(async (options?: ${requestType}) => {
  ${options.hasRequestBody ? `const parsed = ${schema}.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }` : ""}
  
  const params = new URLSearchParams();
  const endpoint = "/${options.endpoint}?" + params.toString();
  const response = await api.${options.httpMethod}<${responseType}>(endpoint${options.hasRequestBody ? ", parsed.data" : ""});
  return ${options.useMapper ? `${options.mapperName}(response)` : "response"};
}, {});
`
}
