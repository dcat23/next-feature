import { names } from '@nx/devkit';
import { NEWLINE_SEPARATOR } from '../../constants';
import { DEFAULT_SECTION, PROPERTY_IDENTIFIER, SECTION_IDENTIFIER } from '../constants';
import type { DotenvChange, SectionLine, SectionName } from '../types';

/**
 * [as-property-name]
 * Normalizes a var name to CONSTANT_CASE, same convention the file already
 * writes (e.g. 'apiUrl' -> 'API_URL').
 * January 30th 2026
 */
export function asPropertyName(name: string): string {
  return names(name).constantName;
}

/**
 * [get-sections]
 * Parses dotenv text into named sections. Lines that look like `KEY=VALUE`
 * are tracked as properties (key normalized to CONSTANT_CASE); everything
 * else (comments, blank lines) is kept as an opaque line that round-trips
 * untouched.
 * August 2nd 2025, 3:36:44 pm
 */
export function getSections(text: string): Record<SectionName, SectionLine[]> {
  const sections: Record<SectionName, SectionLine[]> = {};

  const trimmed = text.trim();
  if (!trimmed) return sections;

  let currentSection = DEFAULT_SECTION;

  trimmed.split(NEWLINE_SEPARATOR).forEach((line) => {
    const sectionMatch = line.match(SECTION_IDENTIFIER);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections[currentSection] ??= [];
      return;
    }

    sections[currentSection] ??= [];

    const propertyMatch = line.match(PROPERTY_IDENTIFIER);
    sections[currentSection].push(
      propertyMatch
        ? { raw: line, key: asPropertyName(propertyMatch[1]) }
        : { raw: line }
    );
  });

  return sections;
}

/**
 * [as-text]
 * Serializes sections back to dotenv text. Sections left with no lines at
 * all (e.g. every property was unset) are dropped entirely.
 * August 2nd 2025, 4:06:19 pm
 */
export function asText(sections: Record<SectionName, SectionLine[]>): string {
  function asEntry([sectionName, lines]: [SectionName, SectionLine[]]): string {
    return [asSectionNameEntry(sectionName), ...lines.map((line) => line.raw)].join(
      NEWLINE_SEPARATOR
    );
  }

  return Object.entries(sections)
    .filter(([, lines]) => lines.length > 0)
    .map(asEntry)
    .join(NEWLINE_SEPARATOR);
}

/**
 * [to-entry]
 * August 2nd 2025, 4:19:57 pm
 */
export function toEntry(name: string, value: string): string {
  return asPropertyName(name).concat('=', value);
}

/**
 * [apply-section-change]
 * Applies `set`/`unset` to a section's lines: existing properties are
 * updated in place (preserving their position relative to comments),
 * unset properties are dropped, and new properties are appended.
 * January 30th 2026
 */
export function applySectionChange(
  lines: SectionLine[],
  change: DotenvChange,
  serialize: (key: string, value: string) => string = toEntry
): SectionLine[] {
  const unsetKeys = new Set((change.unset ?? []).map(asPropertyName));
  const pending = new Map(
    Object.entries(change.set ?? {}).map(([name, value]) => [asPropertyName(name), value])
  );

  const result: SectionLine[] = [];

  for (const line of lines) {
    if (!line.key) {
      result.push(line);
      continue;
    }
    if (unsetKeys.has(line.key)) continue;
    if (pending.has(line.key)) {
      if (change.skipExisting) {
        pending.delete(line.key);
        result.push(line);
        continue;
      }
      const value = pending.get(line.key) as string;
      result.push({ raw: serialize(line.key, value), key: line.key });
      pending.delete(line.key);
      continue;
    }
    result.push(line);
  }

  for (const [key, value] of pending) {
    result.push({ raw: serialize(key, value), key });
  }

  return result;
}

/**
 * [as-section-name]
 * August 2nd 2025, 6:49:26 pm
 */
export function asSectionName(name: string): string {
  return name.trim().toUpperCase();
}

/**
 * [as-section-name-entry]
 * August 3rd 2025, 2:22:03 pm
 */
export function asSectionNameEntry(name: string) {
  return `### ${asSectionName(name)} ###`;
}
