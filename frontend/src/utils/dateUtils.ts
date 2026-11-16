export interface EventStatusInfo {
  status: 'UPCOMING' | 'ONGOING' | 'EXPIRED';
  label: string;
  badgeVariant: 'brand' | 'success' | 'danger' | 'slate';
  timeDescription: string;
  durationDays: number;
  startDateFormatted: string;
  endDateFormatted: string;
  isExpired: boolean;
  isUpcoming: boolean;
  isOngoing: boolean;
}

export function getEventStatusInfo(startInput: string | Date, endInput: string | Date): EventStatusInfo {
  const start = new Date(startInput);
  const end = new Date(endInput);
  const now = new Date();

  // Reset hours for accurate date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffTimeStart = startDateOnly.getTime() - today.getTime();
  const diffDaysStart = Math.ceil(diffTimeStart / (1000 * 60 * 60 * 24));

  const diffTimeEnd = endDateOnly.getTime() - today.getTime();
  const diffDaysEnd = Math.ceil(diffTimeEnd / (1000 * 60 * 60 * 24));

  const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const startDateFormatted = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const endDateFormatted = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Expired (Past Event)
  if (diffDaysEnd < 0) {
    const daysAgo = Math.abs(diffDaysEnd);
    return {
      status: 'EXPIRED',
      label: 'Expired',
      badgeVariant: 'danger',
      timeDescription: daysAgo === 1 ? 'Expired yesterday' : `Ended ${daysAgo} days ago`,
      durationDays,
      startDateFormatted,
      endDateFormatted,
      isExpired: true,
      isUpcoming: false,
      isOngoing: false,
    };
  }

  // 2. Ongoing (Happening Now)
  if (diffDaysStart <= 0 && diffDaysEnd >= 0) {
    return {
      status: 'ONGOING',
      label: 'Happening Now',
      badgeVariant: 'success',
      timeDescription: diffDaysEnd === 0 ? 'Last day today!' : `Ends in ${diffDaysEnd} days`,
      durationDays,
      startDateFormatted,
      endDateFormatted,
      isExpired: false,
      isUpcoming: false,
      isOngoing: true,
    };
  }

  // 3. Upcoming
  let timeDescription = '';
  if (diffDaysStart === 0) {
    timeDescription = 'Starts today!';
  } else if (diffDaysStart === 1) {
    timeDescription = 'Starts tomorrow!';
  } else if (diffDaysStart < 30) {
    timeDescription = `Starts in ${diffDaysStart} days`;
  } else {
    const months = Math.round(diffDaysStart / 30);
    timeDescription = `In ${months} ${months === 1 ? 'month' : 'months'}`;
  }

  return {
    status: 'UPCOMING',
    label: 'Upcoming',
    badgeVariant: 'brand',
    timeDescription,
    durationDays,
    startDateFormatted,
    endDateFormatted,
    isExpired: false,
    isUpcoming: true,
    isOngoing: false,
  };
}
