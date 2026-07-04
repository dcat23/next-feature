import { names } from '@nx/devkit';
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
    case "layout": {
      // package="*" infers the route path from name, e.g. UserResourceFiles -> user/resource/files
      const route = options.package === '*'
        ? names(options.name).fileName.replace(/-/g, '/')
        : options.package;
      options.package = (route && route !== "components")
        ? path.join("app", route)
        : "app"
      break;
    }
    case "hook":
      options.package ??= "hooks";
      break;
    default:
      options.package ??= "components"
  }
}
