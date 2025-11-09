import * as path from 'node:path';

/**
 * [replace-ext]
 * next-feature@0.0.12
 * November 9th 2025, 1:30:43 pm
 */
export function replaceExt(file: string, extension: string) {
  const parsedPath = path.parse(file);
  return path.resolve(parsedPath.name, extension);
}


export function asOutputFile(options: {
  file?: string | boolean;
  fileName?: string;
}) {
  return (
    options.file
      ? typeof options.file === 'string'
        ? options.file
        : options.fileName
      : 'index'
  ).concat('.ts');
}
