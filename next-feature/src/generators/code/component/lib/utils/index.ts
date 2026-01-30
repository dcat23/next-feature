import { ComponentGeneratorSchema } from '../../schema';
import * as path from 'node:path';

/**
 * [handle-app-component]
 * next-feature@0.1.0
 * November 10th 2025, 10:19:51 am
 */
export function handleComponentPackage(options: ComponentGeneratorSchema) {
  switch (options.componentType) {
    case "page":
    case "layout":
      options.package = (options.package && options.package !== "components")
        ? path.join("app", options.package)
        : "app"
      break;
    default:
      options.package ??= "components"
  }
}
