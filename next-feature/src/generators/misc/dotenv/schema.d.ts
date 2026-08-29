export interface DotenvGeneratorSchema {
  projectName: string;
  projects?: string[];
  section?: string;
  set?: string[];
  unset?: string[];
  skipEnvConfig?: boolean;
  files?: string[];
  all?: boolean;
  skipFormat?: boolean;
}
