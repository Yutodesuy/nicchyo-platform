import type { Shop } from "../../map/data/shops";
import type { ConsultCharacterId } from "../data/consultCharacters";

export type ConsultHistoryEntry = {
  role: "user" | "assistant";
  text: string;
  speakerId?: ConsultCharacterId | null;
  speakerName?: string | null;
};

export type ConsultTurn = {
  speakerId: ConsultCharacterId;
  speakerName: string;
  text: string;
};

export type ConsultAskResponse = {
  reply: string;
  imageUrl?: string;
  shopIds?: number[];
  shops?: Shop[];
  turns?: ConsultTurn[];
  memorySummary?: string;
  errorMessage?: string;
  retryable?: boolean;
};
