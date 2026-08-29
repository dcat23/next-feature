/**
 * [section-name]
 * August 2nd 2025, 4:13:12 pm
 */
export type SectionName = 'ROOT' | string;

/**
 * [section-line]
 * A single line within a section's body. `key` is only set when the raw line
 * looks like `KEY=VALUE` (a real property) — comments, blank lines, and
 * anything else round-trip untouched via `raw`.
 * January 30th 2026
 */
export interface SectionLine {
  raw: string;
  key?: string;
}

/**
 * [dotenv-target]
 * Identifies where a dotenv change should be applied.
 * January 30th 2026
 */
export interface DotenvTarget {
  projectRoot: string;
  section?: SectionName;
  /**
   * Suffixes of additional `.env.<suffix>` files to include, beyond the
   * always-included `.env`/`.env.example`. Pass 'all' to discover and
   * include every `.env*` file that already exists in `projectRoot`.
   */
  files?: string[] | 'all';
}

/**
 * [dotenv-change]
 * `skipExisting` leaves an already-present key's value untouched instead of
 * overwriting it with `set`'s value — for registering a sane default
 * without clobbering a value a developer has since hand-edited.
 * January 30th 2026
 */
export interface DotenvChange {
  set?: Record<string, string>;
  unset?: string[];
  skipExisting?: boolean;
}
