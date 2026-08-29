import { joinPathFragments, Tree } from '@nx/devkit';
import { addToGitignore } from '../utils';
import { DEFAULT_SECTION, DOTENV_FILE_IDENTIFIER } from './constants';
import type { DotenvChange, DotenvTarget } from './types';
import {
  applySectionChange,
  asSectionName,
  asText,
  getSections,
} from './utils';

const ROOT_GITIGNORE_DIRECTORY = '.';

/**
 * [resolve-file-names]
 * `.env` and `.env.example` are always included. `target.files` adds
 * `.env.<suffix>` files by name, or, when set to 'all', discovers every
 * `.env*` file that already exists in `projectRoot`.
 * January 30th 2026
 */
function resolveFileNames(
  tree: Tree,
  projectRoot: string,
  files?: DotenvTarget['files']
): string[] {
  const fileNames = new Set<string>(['.env', '.env.example']);

  if (files === 'all') {
    for (const child of tree.children(projectRoot)) {
      if (DOTENV_FILE_IDENTIFIER.test(child)) fileNames.add(child);
    }
  } else {
    for (const suffix of files ?? []) {
      fileNames.add(`.env.${suffix}`);
    }
  }

  return [...fileNames];
}

/**
 * [update-dotenv]
 * Applies a `set`/`unset` change to a single project's dotenv files.
 * Any written file other than `.env.example` is ensured to be gitignored.
 * January 30th 2026
 */
export function updateDotenv(
  tree: Tree,
  target: DotenvTarget,
  change: DotenvChange
): void {
  const section = asSectionName(target.section ?? DEFAULT_SECTION);
  const fileNames = resolveFileNames(tree, target.projectRoot, target.files);

  for (const fileName of fileNames) {
    const filePath = joinPathFragments(target.projectRoot, fileName);
    const text = tree.read(filePath, 'utf-8') ?? '';

    const sections = getSections(text);
    sections[section] = applySectionChange(sections[section] ?? [], change);

    tree.write(filePath, asText(sections));

    if (fileName !== '.env.example') {
      addToGitignore(tree, ROOT_GITIGNORE_DIRECTORY, () => fileName);
    }
  }
}

/**
 * [sync-dotenv]
 * Fans the same dotenv change out across multiple project roots, e.g. to
 * keep a feature and the app(s) consuming it in sync.
 * January 30th 2026
 */
export function syncDotenv(
  tree: Tree,
  projectRoots: string[],
  target: Omit<DotenvTarget, 'projectRoot'>,
  change: DotenvChange
): void {
  for (const projectRoot of projectRoots) {
    updateDotenv(tree, { ...target, projectRoot }, change);
  }
}
