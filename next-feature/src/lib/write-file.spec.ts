import { formatTimestamp } from './write-file';

describe('formatTimestamp', () => {
  it.each([
    ['January 10th 2026, 9:15:08 pm', new Date(2026, 0, 10, 21, 15, 8)],
    ['September 1st 2025, 6:41:00 pm', new Date(2025, 8, 1, 18, 41, 0)],
    ['February 2nd 2026, 12:05:09 am', new Date(2026, 1, 2, 0, 5, 9)],
    ['March 3rd 2026, 12:00:00 pm', new Date(2026, 2, 3, 12, 0, 0)],
    ['April 11th 2026, 9:30:00 am', new Date(2026, 3, 11, 9, 30, 0)],
    ['May 22nd 2026, 9:30:00 am', new Date(2026, 4, 22, 9, 30, 0)],
    ['July 13th 2026, 9:30:00 am', new Date(2026, 6, 13, 9, 30, 0)],
  ])('formats %s (moment\'s "MMMM Do YYYY, h:mm:ss a")', (expected, date) => {
    expect(formatTimestamp(date)).toBe(expected);
  });
});
