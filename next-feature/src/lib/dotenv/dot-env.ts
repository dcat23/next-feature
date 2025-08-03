import { joinPathFragments, logger, Tree } from '@nx/devkit';
import { DEFAULT_SECTION } from './constants';
import type { SectionName } from './types';
import {
  asSectionName,
  asText,
  getSections,
  propertyReducer,
  toEntry,
  toProperty
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

  options.section = asSectionName(options.section ?? DEFAULT_SECTION);

  for (const name of fileNames) {
    const filePath = joinPathFragments(options.projectRoot, name);
    const text = tree.read(filePath, "utf-8") || "";

    const sections: Record<SectionName, string[]> = getSections(text)

    const properties: Record<string, string> = (sections[options.section] ?? [])
      .map(toProperty)
      .reduce(propertyReducer, entries)
    sections[options.section] = Object.entries(properties).map(toEntry)

    logger.info({
      fn: "writeToDotenv",
      sections,
      name: options.section,
      properties
    })

    tree.write(filePath, asText(sections))
  }
}
