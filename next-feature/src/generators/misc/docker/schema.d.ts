export interface DockerGeneratorSchema {
  /** Application to containerize */
  projectName: string;
  /** Host port the compose service publishes (default: 3000) */
  port?: number;
  /** Add the service to the workspace root compose.yaml (default: true) */
  compose?: boolean;
  skipFormat?: boolean;
}
