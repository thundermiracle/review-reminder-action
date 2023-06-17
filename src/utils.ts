import { differenceInBusinessDays, differenceInDays } from 'date-fns';

// judge if it's stale pr
export const isStalePr = (
  prUpdatedDate: Date,
  currentDate: Date,
  staleDays: number,
  onlyBusinessDays: boolean,
): boolean => {
  if (!Number.isInteger(staleDays) || staleDays < 0) {
    throw new Error('stale-days must be a positive integer');
  }

  const diffDays = onlyBusinessDays
    ? differenceInBusinessDays(currentDate, prUpdatedDate)
    : differenceInDays(currentDate, prUpdatedDate);

  return diffDays >= staleDays;
};
