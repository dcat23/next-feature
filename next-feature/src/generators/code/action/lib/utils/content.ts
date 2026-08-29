import { NormalizedActionGeneratorSchema } from "../types"

/**
 * [api-content]
 * next-feature@0.1.2-2
 * January 31st 2026, 2:17:33 pm
 */
export function apiContent(options: NormalizedActionGeneratorSchema) {
  const { hasRequestBody } = options; 
  const responseType = options.names.className + "Response";
  const requestType = options.names.className + "Request";
  const schema = options.names.propertyName + "Schema";
  const useApi = /(api|form)/.test(options.actionType);
  const useForm = options.actionType === 'form';
  const formMapper = "parse" + requestType;
  return`
${hasRequestBody ? `const ${schema} = z.object({});` : ""}
export type ${requestType} = ${hasRequestBody ? `z.infer<typeof ${schema}>;` : "{};"}
export type ${responseType} = {};

${useForm ? `function ${formMapper}(formData: FormData): ${requestType} {
  return {};
}`: ""}

export const ${options.methodName} = ${useApi ? "withApi" : ""}(async (${useForm ? "formData: FormData" : `options?: ${requestType}`}) => {
  ${useForm ? `const options = ${formMapper}(formData);` : ""}
  ${hasRequestBody ? `const parsed = ${schema}.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }` : ""}
  
  ${!hasRequestBody ? `const params = new URLSearchParams();
  const endpoint = "/${options.endpoint}?" + params.toString();
  ` : `const endpoint = "/${options.endpoint}";`}
  const response = await api.${options.httpMethod}<${responseType}>(endpoint${hasRequestBody ? ", parsed.data" : ""});
  return ${options.useMapper ? `${options.mapperName}(response)` : "response"};
}${useApi ? ", {}": ""});

${useForm ? `export const ${options.methodName}Action = withForm(${options.methodName})` : ""}
`
}
