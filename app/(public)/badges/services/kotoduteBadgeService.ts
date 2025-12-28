import { loadKotodute } from '../../../../lib/kotoduteStorage';

const LIKE_STORAGE_KEY = 'nicchyo-kotodute-likes';

export type BadgeDef = {
  id: string;
  label: string;
  threshold: number;
};

function loadLikes(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(LIKE_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function getKotoduteProgress() {
  const notes = loadKotodute();
  const likesMap = loadLikes();

  const noteCount = notes.length;
  const likeCount = Object.values(likesMap).reduce((acc, n) => acc + (Number(n) || 0), 0);

  return {
    noteCount,
    likeCount,
  };
}

export const NOTE_BADGES: BadgeDef[] = [
  { id: 'note-01', label: 'ことづて 1通', threshold: 1 },
  { id: 'note-05', label: 'ことづて 5通', threshold: 5 },
  { id: 'note-10', label: 'ことづて 10通', threshold: 10 },
  { id: 'note-20', label: 'ことづて 20通', threshold: 20 },
  { id: 'note-50', label: 'ことづて 50通', threshold: 50 },
  { id: 'note-100', label: 'ことづて 100通', threshold: 100 },
];

export const LIKE_BADGES: BadgeDef[] = [
  { id: 'like-01', label: 'いいね 1個', threshold: 1 },
  { id: 'like-10', label: 'いいね 10個', threshold: 10 },
  { id: 'like-30', label: 'いいね 30個', threshold: 30 },
  { id: 'like-60', label: 'いいね 60個', threshold: 60 },
  { id: 'like-100', label: 'いいね 100個', threshold: 100 },
];
