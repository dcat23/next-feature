import DefaultChangelogRenderer from 'nx/release/changelog-renderer';

type Author = { name: string; email: string };

/**
 * Co-authors that are tools, not people: GitHub already credits them on each
 * commit (Co-authored-by trailers), so they're left out of "Thank You".
 */
export function isBotAuthor({ email }: Pick<Author, 'email'>): boolean {
  return (
    email.toLowerCase() === 'noreply@anthropic.com' ||
    // Nx's renderer already skips names containing [bot]
    /\[bot\]@users\.noreply\.github\.com$/i.test(email)
  );
}

/** Nx's default renderer, minus bot co-authors in the "❤️ Thank You" section */
export default class ChangelogRenderer extends DefaultChangelogRenderer {
  protected override async renderAuthors(): Promise<string[]> {
    // The default renderAuthors() collects authors from these two lists
    const { relevantChanges, additionalChangesForAuthorsSection } = this;
    const withoutBots = (changes: typeof relevantChanges) =>
      changes.map((change) => ({
        ...change,
        authors: change.authors?.filter((author) => !isBotAuthor(author)),
      }));

    this.relevantChanges = withoutBots(relevantChanges);
    this.additionalChangesForAuthorsSection = withoutBots(
      additionalChangesForAuthorsSection,
    );
    try {
      return await super.renderAuthors();
    } finally {
      this.relevantChanges = relevantChanges;
      this.additionalChangesForAuthorsSection =
        additionalChangesForAuthorsSection;
    }
  }
}
