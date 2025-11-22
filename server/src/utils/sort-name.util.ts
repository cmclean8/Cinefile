/**
 * Calculates a sort name by stripping common articles from the beginning of a name.
 * Articles handled: "The", "A", "An" (case-insensitive)
 * 
 * @param name - The original name
 * @returns The sort name with articles removed, trimmed
 * 
 * @example
 * calculateSortName("The Batman") // "Batman"
 * calculateSortName("A Clockwork Orange") // "Clockwork Orange"
 * calculateSortName("An American Werewolf") // "American Werewolf"
 * calculateSortName("Batman") // "Batman"
 */
export function calculateSortName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }

  // Articles to strip (case-insensitive, must be at start of string)
  const articles = ['the ', 'a ', 'an '];
  
  const lowerTrimmed = trimmed.toLowerCase();
  
  for (const article of articles) {
    if (lowerTrimmed.startsWith(article)) {
      // Remove the article and return trimmed result
      return trimmed.substring(article.length).trim();
    }
  }
  
  // No article found, return as-is
  return trimmed;
}

