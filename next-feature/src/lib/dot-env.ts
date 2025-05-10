import { joinPathFragments, logger, names, Tree } from '@nx/devkit';

interface DotenvOptions {
  projectRoot: string;
}

export function asRecord(text: string) {
  const variables: Record<string, string> = {};
  text.split("\n")
    // .filter(Boolean)
    .forEach((line) => {
    const [k, v] = line.split("=", 2);
    variables[k] = v;
  });
  return variables;
}

export function asText(variables: Record<string, string>) {
  const toEntry = ([k,v]: string[]) => {
    if (k.startsWith("#")) return k;
    const key = names(k).constantName;
    return key ? [names(key).constantName, v].join("=") : "";
  };

  return Object.entries(variables)
    .map(toEntry)
    .join("\n");
}

export function writeToDotenv(tree: Tree, options: DotenvOptions, entries: Record<string, string>, ...files: string[]) {
  const fileNames = new Set([
    ".env",
    ".env.example",
    ...files.map(f => ".env.".concat(f))
  ]);

  for (const name of fileNames) {
    const filePath = joinPathFragments(options.projectRoot, name);
    const text = tree.read(filePath, "utf-8") || "";
    const variables: Record<string, string> = asRecord(text)

    for (const [k, v] of Object.entries(entries)) {
      variables[k] ??= v;
    }

    tree.write(filePath, asText(variables))
  }
}
