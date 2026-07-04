import type { SectionName } from '../types';

/**
 * [section-identifier]
 * August 2nd 2025, 3:31:30 pm
 */
export const SECTION_IDENTIFIER = /^#{3}\s*(.+?)\s*#{3}$/;

/**
 * [property-identifier]
 * Matches a real `KEY=VALUE` line so comments/blank lines can be told apart
 * from properties instead of being parsed as one.
 * January 30th 2026
 */
export const PROPERTY_IDENTIFIER = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

/**
 * [default-section]
 * August 3rd 2025, 4:50:23 am
 */
export const DEFAULT_SECTION: SectionName = "ROOT";

/**
 * [dotenv-file-identifier]
 * Matches any `.env` / `.env.<suffix>` file name for 'files: all' discovery.
 * January 30th 2026
 */
export const DOTENV_FILE_IDENTIFIER = /^\.env(\..+)?$/;
