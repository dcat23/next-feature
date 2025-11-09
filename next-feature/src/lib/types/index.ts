import type { names } from '@nx/devkit';

export interface GeneratorSchema {
  name?: string;
  projectName?: string;
  directory?: string;
  package?: string;
  skipFormat?: boolean;
}

export interface ProjectGeneratorSchema
  extends Omit<GeneratorSchema, 'projectName'> {
  name: string;
  orgName?: string;
}

export interface CodeGeneratorSchema extends GeneratorSchema {
  name: string;
  projectName: ProjectGeneratorSchema['name'];
  file?: string | boolean; // will create in an associated file
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {
  tmpl: '';
};

export type NormalizedProjectGeneratorSchema<
  Schema extends ProjectGeneratorSchema
> = Normalized<Schema> & {
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
};

export type NormalizedCodeGeneratorSchema<Schema extends CodeGeneratorSchema> =
  Normalized<Schema> & {
    names: Names;
    outputFileName: Names['fileName']; // appended with extension
  };

export type Names = ReturnType<typeof names>;

export type WithNames<T extends GeneratorSchema> = Names & T;

/**
 * [config-generator-schema]
 * next-feature@0.1.0
 * November 9th 2025, 3:13:42 pm
 */
export interface ConfigGeneratorSchema extends CodeGeneratorSchema {}
