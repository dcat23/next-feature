
export interface GeneratorSchema {
  project: string;
}

export type Normalize<Schema extends GeneratorSchema> = Schema & {

}
