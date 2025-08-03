import { joinPathFragments, logger, Tree } from '@nx/devkit';
import type { SectionName } from './types';
import {
  asText,
  getSections,
  propertyReducer,
  toEntry,
  toProperty,
} from './utils';

interface DotenvOptions {
  projectRoot: string;
  section?: SectionName;
}


export function writeToDotenv(tree: Tree, options: DotenvOptions, entries: Record<string, string>, ...files: string[]) {
  const fileNames = new Set([
    ".env",
    ".env.example",
    ...files.map(f => ".env.".concat(f))
  ]);

  options.section ??= ""

  for (const name of fileNames) {
    const filePath = joinPathFragments(options.projectRoot, name);
    const text = tree.read(filePath, "utf-8") || "";

    const sections: Record<SectionName, string[]> = getSections(text)

    const properties: Record<string, string> = (sections[options.section] ?? [])
      .map(toProperty)
      .reduce(propertyReducer, entries)

    sections[options.section] = Object.entries(properties).map(toEntry)

    tree.write(filePath, asText(sections))
  }
}
