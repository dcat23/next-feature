export interface ClientConfigGeneratorSchema {
  projectName?: string;
  clientPackage?: string;
  baseUrl?: string;
  includeInterceptors?: boolean;
  skipFormat?: boolean;
}
