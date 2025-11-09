import type { names } from '@nx/devkit';

export interface GeneratorSchema {
  name?: string;
  projectName?: string;
  directory?: string;
  package?: string;
  skipFormat?: boolean;
}

export type Normalized<Schema extends GeneratorSchema> = Schema & {
  tmpl: ""
}

export interface ProjectGeneratorSchema extends Omit<GeneratorSchema, "projectName"> {
  name: string;
}

export interface NormalizedProjectGeneratorSchema extends Normalized<ProjectGeneratorSchema> {
  projectRoot: string;
  sourceRoot: string;
  importPath: string;
}

export interface CodeGeneratorSchema extends GeneratorSchema {
  name: string;
  projectName: ProjectGeneratorSchema["name"];
  file?: string | boolean // will create in an associated file
}

export interface NormalizedCodeGeneratorSchema extends Normalized<CodeGeneratorSchema> {
  names: Names
  outputFileName: Names["fileName"] // appended with extension

}

export type Names = ReturnType<typeof names>;

export type WithNames<T extends GeneratorSchema> = Names & T;
