import { logger, names } from '@nx/devkit';
import { NEWLINE_SEPARATOR } from '../../constants';
import { SECTION_IDENTIFIER } from '../constants';
import type { Property, SectionName } from '../types';

/**
 * [get-sections]
 * August 2nd 2025, 3:36:44 pm
 */
export function getSections(text: string): Record<SectionName, string[]> {
  const sections: Record<SectionName, string[]> = {};

  let currentSection = '';
  let entries: string[] = [];

  text.split(NEWLINE_SEPARATOR).forEach((line) => {
    if (line.includes(SECTION_IDENTIFIER)) {
      sections[currentSection] = Array.from(new Set(entries));
      currentSection = line
        .replace(SECTION_IDENTIFIER, '')
        .trim()
        .toUpperCase();
      entries = [];
    } else {
      entries.push(line);
    }
  });

  logger.info({ sections });
  return sections;
}

/**
 * [as-text]
 * August 2nd 2025, 4:06:19 pm
 */
export function asText(sections: Record<SectionName, string[]>) {

  function asEntry([sectionName, properties]: [SectionName, string[]]): string {
    const lines: string[] = [
      asSectionName(sectionName),
      ...properties
    ];

    return lines.join(NEWLINE_SEPARATOR);
  }

  return Object.entries(sections)
    .map(asEntry)
    .join(NEWLINE_SEPARATOR);
}

/**
 * [to-property]
 * August 2nd 2025, 4:17:50 pm
 */
export function toProperty(line: string): Property {
  const [name, value] = line.split('=', 2);
  return {
    name,
    value,
  };
}

/**
 * [to-entry]
 * August 2nd 2025, 4:19:57 pm
 */
export function toEntry(entry: [string, string]): string {
  const [k, v] = entry;
  const name = names(k).constantName;
  const value = `"${v}"`;
  return name.concat('=', value);
}

/**
 * [property-reducer]
 * August 2nd 2025, 5:10:51 pm
 */
export function propertyReducer(
  entries: Record<string, string>,
  property: Property
): Record<string, string> {
  entries[property.name] ??= property.value;
  return entries;
}

/**
 * [as-section-name]
 * August 2nd 2025, 6:49:26 pm
 */
export function asSectionName(name: string): string {
  return `### ${
    name.trim().toUpperCase()
  } ###`;
}
