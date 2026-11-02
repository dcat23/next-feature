export interface VercelGeneratorSchema {
  /** Application to deploy */
  projectName: string;
  /** Skip deployments of commits that don't affect the application (default: true) */
  ignoreUnaffected?: boolean;
  skipFormat?: boolean;
}
