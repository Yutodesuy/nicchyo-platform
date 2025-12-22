import { grandmaComments } from '../data/grandmaComments';
import type { GrandmaComment } from '../types/grandmaComment';

export const grandmaCommentPool: GrandmaComment[] = grandmaComments;

export function pickNextComment(pool: GrandmaComment[], currentId?: string) {
  if (!pool.length) return undefined;
  if (!currentId) return pool[0];
  const currentIndex = pool.findIndex((c) => c.id === currentId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pool.length : 0;
  return pool[nextIndex];
}
