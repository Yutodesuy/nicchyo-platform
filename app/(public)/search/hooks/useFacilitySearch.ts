import { useMemo } from 'react';
import { facilities, Facility } from '../../map/data/facilities';

export function useFacilitySearch(textQuery: string): Facility[] {
  return useMemo(() => {
    if (!textQuery.trim()) return [];

    const query = textQuery.toLowerCase().trim();

    // Map common keywords to facility types
    const isToiletQuery =
      query.includes('トイレ') ||
      query.includes('toilet') ||
      query.includes('お手洗い') ||
      query.includes('wc');

    const isBenchQuery =
      query.includes('ベンチ') ||
      query.includes('bench') ||
      query.includes('休憩') ||
      query.includes('椅子') ||
      query.includes('座る');

    if (isToiletQuery && isBenchQuery) {
        return facilities; // Return all if both matches (unlikely but possible)
    }

    if (isToiletQuery) {
      return facilities.filter(f => f.type === 'toilet');
    }

    if (isBenchQuery) {
      return facilities.filter(f => f.type === 'bench');
    }

    // Also match by name explicitly just in case
    return facilities.filter(f => f.name.toLowerCase().includes(query));
  }, [textQuery]);
}
