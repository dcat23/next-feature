export interface CicdGeneratorSchema {
  /** Applications deployed as Docker images to ghcr.io */
  docker?: string[];
  /** Applications deployed to Vercel with the Vercel CLI */
  vercel?: string[];
  /** Add a CI job for the affected projects' e2e target (default: false) */
  e2e?: boolean;
  /** Dependency update configuration (default: none) */
  dependencyUpdates?: 'none' | 'dependabot';
  skipFormat?: boolean;
}
