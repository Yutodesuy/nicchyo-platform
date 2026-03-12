import fs from "fs/promises";
import path from "path";

export type EditableLandmark = {
  key: string;
  name: string;
  description: string;
  url: string;
  lat: number;
  lng: number;
  widthPx: number;
  heightPx: number;
  showAtMinZoom: boolean;
};

const LANDMARKS_PATH = path.resolve(
  process.cwd(),
  "app",
  "(public)",
  "map",
  "data",
  "landmarks.json"
);

export async function readLandmarks(): Promise<EditableLandmark[]> {
  const raw = await fs.readFile(LANDMARKS_PATH, "utf8");
  return JSON.parse(raw) as EditableLandmark[];
}

export async function writeLandmarks(landmarks: EditableLandmark[]) {
  await fs.writeFile(LANDMARKS_PATH, `${JSON.stringify(landmarks, null, 2)}\n`, "utf8");
}
