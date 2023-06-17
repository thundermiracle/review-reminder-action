import { isStalePr } from '../src/utils';

describe('isStalePr', () => {
  const staleDays = 3;

  it.each([
    {
      prUpdatedDate: '2023-06-17',
      currentDate: '2023-06-21',
      expected: false,
      condition: '[stale not enough]start in weekend and end in business day',
    },
    {
      prUpdatedDate: '2023-06-17',
      currentDate: '2023-06-22',
      expected: true,
      condition: '[stale enough]start in weekend and end in business day',
    },
    {
      prUpdatedDate: '2023-06-15',
      currentDate: '2023-06-18',
      expected: false,
      condition: '[stale not enough]start in business day and end in weekend',
    },
    {
      prUpdatedDate: '2023-06-14',
      currentDate: '2023-06-18',
      expected: true,
      condition: '[stale enough]start in business day and end in weekend',
    },
    {
      prUpdatedDate: '2023-06-15',
      currentDate: '2023-06-19',
      expected: false,
      condition:
        '[stale not enough]start in business day and end in business day with weekend between',
    },
    {
      prUpdatedDate: '2023-06-14',
      currentDate: '2023-06-19',
      expected: true,
      condition:
        '[stale enough]start in business day and end in business day with weekend between',
    },
  ])(
    `[onlyBusinessDay: true]should return $expect if $condition`,
    ({ prUpdatedDate, currentDate, expected }) => {
      const result = isStalePr(
        new Date(prUpdatedDate),
        new Date(currentDate),
        staleDays,
        true,
      );
      expect(result).toBe(expected);
    },
  );

  it.each([
    {
      prUpdatedDate: '2023-06-17',
      currentDate: '2023-06-19',
      expected: false,
      condition: '[stale not enough]start in weekend and end in business day',
    },
    {
      prUpdatedDate: '2023-06-17',
      currentDate: '2023-06-20',
      expected: true,
      condition: '[stale enough]start in weekend and end in business day',
    },
    {
      prUpdatedDate: '2023-06-15',
      currentDate: '2023-06-17',
      expected: false,
      condition: '[stale not enough]start in business day and end in weekend',
    },
    {
      prUpdatedDate: '2023-06-15',
      currentDate: '2023-06-18',
      expected: true,
      condition: '[stale enough]start in business day and end in weekend',
    },
    {
      prUpdatedDate: '2023-06-16',
      currentDate: '2023-06-19',
      expected: true,
      condition:
        '[stale enough]start in business day and end in business day with weekend between',
    },
  ])(
    `[onlyBusinessDay: false]should return $expect if $condition`,
    ({ prUpdatedDate, currentDate, expected }) => {
      const result = isStalePr(
        new Date(prUpdatedDate),
        new Date(currentDate),
        staleDays,
        false,
      );
      expect(result).toBe(expected);
    },
  );
});
