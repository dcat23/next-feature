import { pluralize, singularize } from './string';

describe('singularize', () => {
  it.each([
    ['Users', 'User'],
    ['Categories', 'Category'],
    ['Statuses', 'Status'],
    ['Status', 'Status'],
    ['Boxes', 'Box'],
  ])('applies the pattern rules: %s -> %s', (word, expected) => {
    expect(singularize(word)).toBe(expected);
  });

  it.each([
    ['News', 'News'],
    ['news', 'news'],
    ['Series', 'Series'],
    ['UserNews', 'UserNews'],
    ['Alumni', 'Alumnus'],
    ['SchoolAlumni', 'SchoolAlumnus'],
  ])('uses the word lists: %s -> %s', (word, expected) => {
    expect(singularize(word)).toBe(expected);
  });
});

describe('pluralize', () => {
  it.each([
    ['user', 'users'],
    ['category', 'categories'],
    ['status', 'statuses'],
  ])('applies the pattern rules: %s -> %s', (word, expected) => {
    expect(pluralize(word)).toBe(expected);
  });

  it.each([
    ['news', 'news'],
    ['series', 'series'],
    ['alumnus', 'alumni'],
    ['Alumnus', 'Alumni'],
  ])('uses the word lists: %s -> %s', (word, expected) => {
    expect(pluralize(word)).toBe(expected);
  });
});
