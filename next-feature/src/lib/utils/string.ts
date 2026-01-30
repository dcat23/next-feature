/**
 * String utility functions for singularization and pluralization
 * Uses general pattern matching to handle common English word transformations
 */

const irregulars: Record<string, string> = {
  acme: 'acme',
  aegis: 'aegis',
  agenda: 'agenda',
  aide: 'aide',
  album: 'album',
  alumni: 'alumnus',
  analysis: 'analysis',
  anime: 'anime',
  atlas: 'atlas',
  axe: 'axe',
  axis: 'axis',
  beau: 'beau',
  bias: 'bias',
  biopsy: 'biopsy',
  bream: 'bream',
  cactus: 'cactus',
  carp: 'carp',
  cache: 'cache',
  chassis: 'chassis',
  chess: 'chess',
  clothing: 'clothing',
  cod: 'cod',
  corps: 'corps',
  debris: 'debris',
  diabetes: 'diabetes',
  diagnosis: 'diagnosis',
  djinn: 'djinn',
  elk: 'elk',
  eland: 'eland',
  emoji: 'emoji',
  equipment: 'equipment',
  excretion: 'excretion',
  expertise: 'expertise',
  firmware: 'firmware',
  flounder: 'flounder',
  fun: 'fun',
  gallows: 'gallows',
  garbage: 'garbage',
  graffiti: 'graffiti',
  hardware: 'hardware',
  headquarters: 'headquarters',
  health: 'health',
  heart: 'heart',
  highjinks: 'highjinks',
  homework: 'homework',
  housework: 'housework',
  information: 'information',
  jeans: 'jeans',
  justice: 'justice',
  kudos: 'kudos',
  literature: 'literature',
  machinery: 'machinery',
  mackerel: 'mackerel',
  mail: 'mail',
  media: 'media',
  mews: 'mews',
  moose: 'moose',
  music: 'music',
  mud: 'mud',
  manga: 'manga',
  news: 'news',
  only: 'only',
  pike: 'pike',
  plankton: 'plankton',
  pliers: 'pliers',
  police: 'police',
  pollution: 'pollution',
  premises: 'premises',
  rain: 'rain',
  research: 'research',
  rice: 'rice',
  salmon: 'salmon',
  scissors: 'scissors',
  series: 'series',
  sewage: 'sewage',
  shambles: 'shambles',
  shrimp: 'shrimp',
  software: 'software',
  species: 'species',
  staff: 'staff',
  swine: 'swine',
  tennis: 'tennis',
  traffic: 'traffic',
  transportation: 'transportation',
  trout: 'trout',
  tuna: 'tuna',
  wealth: 'wealth',
  welfare: 'welfare',
  whiting: 'whiting',
  wildebeest: 'wildebeest',
};
const uncountables = [
  'adulthood',
  'advice',
  'agenda',
  'aid',
  'aircraft',
  'alcohol',
  'ammo',
  'analytics',
  'anime',
  'athletics',
  'audio',
  'bison',
  'blood',
  'bream',
  'buffalo',
  'butter',
  'carp',
  'cash',
  'chassis',
  'chess',
  'clothing',
  'cod',
  'commerce',
  'cooperation',
  'corps',
  'debris',
  'diabetes',
  'digestion',
  'elk',
  'energy',
  'equipment',
  'excretion',
  'expertise',
  'firmware',
  'flounder',
  'fun',
  'gallows',
  'garbage',
  'graffiti',
  'hardware',
  'headquarters',
  'health',
  'heart',
  'heavy',
  'hedgehog',
  'homework',
  'housework',
  'information',
  'jeans',
  'justice',
  'kudos',
  'literature',
  'machinery',
  'mackerel',
  'mail',
  'media',
  'mews',
  'moose',
  'music',
  'mud',
  'manga',
  'news',
  'only',
  'pike',
  'plankton',
  'pliers',
  'police',
  'pollution',
  'premises',
  'rain',
  'research',
  'rice',
  'salmon',
  'scissors',
  'software',
  'swine',
  'tennis',
  'traffic',
  'transportation',
  'trout',
  'tuna',
  'wealth',
  'welfare',
  'whiting',
  'wildebeest',
  'you',
  'pok[eé]mon',
];

/**
 * Singularize an English word by removing plural suffixes
 * Ensures words ending with 's' are only singular when grammatically correct
 *
 * Examples:
 *   - "Users" -> "User"
 *   - "Categories" -> "Category"
 *   - "Statuses" -> "Status"
 *   - "Status" -> "Status" (already singular)
 *
 * @param word The word to singularize
 * @returns The singularized form of the word
 */
export function singularize(word: string): string {
  if (!word || word.length <= 1) {
    return word;
  }

  // Words ending in -ies -> change to -y
  if (word.endsWith('ies') && word.length > 3) {
    return word.slice(0, -3) + 'y';
  }

  // Words ending in -ses -> remove -es
  if (word.endsWith('ses') && word.length > 3) {
    return word.slice(0, -2);
  }

  // Words ending in -xes, -zes -> remove -es
  if ((word.endsWith('xes') || word.endsWith('zes')) && word.length > 3) {
    return word.slice(0, -2);
  }

  // Words ending in -ches, -shes -> remove -es
  if ((word.endsWith('ches') || word.endsWith('shes')) && word.length > 4) {
    return word.slice(0, -2);
  }

  // Words ending in -oes -> remove -es
  if (word.endsWith('oes') && word.length > 3) {
    return word.slice(0, -2);
  }

  // Generic -s removal (skip words ending in -tus, -sis, -xis like status, basis, axis)
  if (
    word.endsWith('s') &&
    !word.slice(0, -1).endsWith('s') &&
    !word.toLowerCase().endsWith('tus') &&
    !word.toLowerCase().endsWith('sis') &&
    !word.toLowerCase().endsWith('xis')
  ) {
    return word.slice(0, -1);
  }

  return word;
}

/**
 * Pluralize an English word by adding appropriate suffixes
 *
 * Examples:
 *   - "User" -> "Users"
 *   - "Category" -> "Categories"
 *   - "Status" -> "Statuses"
 *   - "Box" -> "Boxes"
 *
 * @param word The word to pluralize
 * @returns The pluralized form of the word
 */
export function pluralize(word: string): string {
  if (!word || word.length <= 1) {
    return word;
  }

  const lower = word.toLowerCase();

  // Consonant + y -> ies
  if (word.endsWith('y') && word.length > 1) {
    const beforeY = word.charAt(word.length - 2);
    if (!/[aeiou]/.test(beforeY)) {
      return word.slice(0, -1) + 'ies';
    }
  }

  // s, x, z -> es
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  }

  // ch, sh -> es
  if (word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }

  // f, fe -> ves (with common exceptions)
  if (word.endsWith('fe')) {
    return word.slice(0, -2) + 'ves';
  }
  if (word.endsWith('f') && word.length > 1 && !/[oa]f$/.test(lower)) {
    return word.slice(0, -1) + 'ves';
  }

  // Consonant + o -> oes (with common exceptions like photo, piano)
  if (word.endsWith('o') && word.length > 1) {
    const beforeO = word.charAt(word.length - 2);
    const exceptions = ['photo', 'piano', 'halo', 'solo'];
    if (!/[aeiou]/.test(beforeO) && !exceptions.includes(lower)) {
      return word + 'es';
    }
  }

  // Default: add s
  return word + 's';
}
