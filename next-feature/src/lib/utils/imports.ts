import { Tree } from '@nx/devkit';

const DIRECTIVE_PATTERN = /^\s*(['"])use (server|client)\1;?[ \t]*$/m;
const IMPORT_PATTERN =
  /^import\s(?:[^;'"]*?\sfrom\s+)?['"][^'"]+['"];?[ \t]*$/gm;

const IDENTIFIER = '[A-Za-z_$][\\w$]*';

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * [add-named-imports]
 * Adds named import specifiers (e.g. `z`, `type UserRequest`) to a file,
 * merging into an existing `import { ... } from '<moduleSpecifier>'` when
 * one exists. Otherwise inserts a new import after the last import, or
 * after a leading 'use server' / 'use client' directive.
 */
export function addNamedImports(
  tree: Tree,
  filePath: string,
  moduleSpecifier: string,
  specifiers: string[]
) {
  const buffer = tree.read(filePath, 'utf-8') ?? '';
  const module = escapeRegex(moduleSpecifier);
  const existingPattern = new RegExp(
    `^import\\s+(?:(${IDENTIFIER})\\s*,\\s*)?\\{([^}]*)\\}\\s+from\\s+['"]${module}['"];?`,
    'm'
  );

  const existing = buffer.match(existingPattern);
  if (existing) {
    const current = existing[2]
      .split(',')
      .map((specifier) => specifier.trim())
      .filter(Boolean);
    const merged = [...new Set([...current, ...specifiers])];
    if (merged.length === current.length) return;

    tree.write(
      filePath,
      buffer.replace(
        existingPattern,
        `import ${existing[1] ? `${existing[1]}, ` : ''}{ ${merged.join(', ')} } from '${moduleSpecifier}';`
      )
    );
    return;
  }

  // Merge into a default-only import from the same module
  const defaultPattern = new RegExp(`^import\\s+(${IDENTIFIER})\\s+from\\s+['"]${module}['"];?`, 'm');
  const existingDefault = buffer.match(defaultPattern);
  if (existingDefault) {
    tree.write(
      filePath,
      buffer.replace(
        defaultPattern,
        `import ${existingDefault[1]}, { ${[...new Set(specifiers)].join(', ')} } from '${moduleSpecifier}';`
      )
    );
    return;
  }

  const statement = `import { ${[...new Set(specifiers)].join(', ')} } from '${moduleSpecifier}';`;

  const imports = [...buffer.matchAll(IMPORT_PATTERN)];
  const anchor = imports.length
    ? imports[imports.length - 1]
    : buffer.match(DIRECTIVE_PATTERN);

  if (!anchor) {
    tree.write(filePath, `${statement}\n${buffer}`);
    return;
  }

  const index = (anchor.index ?? 0) + anchor[0].length;
  const separator = imports.length ? '\n' : '\n\n';
  tree.write(
    filePath,
    `${buffer.slice(0, index)}${separator}${statement}${buffer.slice(index)}`
  );
}

/**
 * [add-default-import]
 * Adds `import <localName> from '<moduleSpecifier>'` after the last import,
 * unless the file already has a default import from that module.
 */
export function addDefaultImport(
  tree: Tree,
  filePath: string,
  moduleSpecifier: string,
  localName: string
) {
  const buffer = tree.read(filePath, 'utf-8') ?? '';
  const module = escapeRegex(moduleSpecifier);
  const existingDefault = new RegExp(
    `^import\\s+${IDENTIFIER}\\s*(?:,\\s*\\{[^}]*\\})?\\s+from\\s+['"]${module}['"]`,
    'm'
  );
  if (existingDefault.test(buffer)) return;

  // Merge into a named-only import from the same module
  const namedPattern = new RegExp(`^import\\s+(\\{[^}]*\\})\\s+from\\s+(['"]${module}['"];?)`, 'm');
  if (namedPattern.test(buffer)) {
    tree.write(filePath, buffer.replace(namedPattern, `import ${localName}, $1 from $2`));
    return;
  }

  const statement = `import ${localName} from '${moduleSpecifier}';`;
  const imports = [...buffer.matchAll(IMPORT_PATTERN)];
  const anchor = imports.length
    ? imports[imports.length - 1]
    : buffer.match(DIRECTIVE_PATTERN);

  if (!anchor) {
    tree.write(filePath, `${statement}\n${buffer}`);
    return;
  }

  const index = (anchor.index ?? 0) + anchor[0].length;
  const separator = imports.length ? '\n' : '\n\n';
  tree.write(
    filePath,
    `${buffer.slice(0, index)}${separator}${statement}${buffer.slice(index)}`
  );
}
