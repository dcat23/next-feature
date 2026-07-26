import { names } from '@nx/devkit';
import { ComponentGeneratorSchema } from '../../schema';
import * as path from 'node:path';

/**
 * [handle-app-component]
 * next-feature@0.1.0
 * November 10th 2025, 10:19:51 am
 */
export function handleComponentPackage(options: ComponentGeneratorSchema) {
  if (options.componentType === 'page') {
    // inferPath splits `name` into nested route segments, e.g. UserResourceFiles -> user/resource/files
    const route = options.inferPath
      ? names(options.name).fileName.replace(/-/g, '/')
      : options.package;
    options.package = (route && route !== 'components')
      ? path.join('app', route)
      : 'app';
    return;
  }
  options.package ??= 'components';
}
