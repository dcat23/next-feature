import type { GeneratorSchema, Normalized, WithNames, Names } from '../../lib/types';

export interface UtilsGeneratorSchema extends GeneratorSchema {
  name: string;
  projectName: string;
  file?: string | boolean // will create in an associated file
}

export interface NormalizedUtilsGeneratorSchema extends Normalized<WithNames<UtilsGeneratorSchema>> {
    tmpl: ""
    outputFileName: Names["fileName"] // appended with extension
}
