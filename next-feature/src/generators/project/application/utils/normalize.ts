import {
  ApplicationGeneratorSchema,
  NormalizedApplicationGeneratorSchema,
} from '../schema';
import { normalizeProjectGeneratorSchema } from '../../../../lib/utils/project-generator';
import * as path from "path";

/**
 * [normalize-application-generator]
 * next-feature@0.1.1-beta.5
 * January 10th 2026, 9:15:08 pm
 */
export function normalizeApplicationGeneratorSchema(
  options: ApplicationGeneratorSchema
): NormalizedApplicationGeneratorSchema {
  const normalized = normalizeProjectGeneratorSchema(options, "app");
  normalized.useSrc = Boolean(options.useSrc);
  normalized.skipLogging = Boolean(options.skipLogging);
  normalized.sourceRoot = normalized.useSrc 
    ? path.join(normalized.projectRoot, "src")
    : normalized.projectRoot
    
  return {
    ...normalized,
  };
}
