export interface Facility {
  id: string;
  type: 'toilet' | 'bench';
  name: string;
  lat: number;
  lng: number;
}

// Coordinate configuration for Sunday Market
// Range: North 33.565 to South 33.553
// Center Line: 133.531

const ROAD_NORTH = 33.5645;
const ROAD_SOUTH = 33.5535;
const ROAD_CENTER_LNG = 133.5310;
const ROAD_WIDTH_OFFSET = 0.00015; // Slightly off center

const createToilet = (id: number, lat: number, side: 'east' | 'west'): Facility => ({
  id: `toilet-${id}`,
  type: 'toilet',
  name: '公衆トイレ',
  lat,
  lng: side === 'east'
    ? ROAD_CENTER_LNG + ROAD_WIDTH_OFFSET * 2
    : ROAD_CENTER_LNG - ROAD_WIDTH_OFFSET * 2,
});

const createBench = (id: number, lat: number, side: 'east' | 'west'): Facility => ({
  id: `bench-${id}`,
  type: 'bench',
  name: '休憩ベンチ',
  lat,
  lng: side === 'east'
    ? ROAD_CENTER_LNG + ROAD_WIDTH_OFFSET
    : ROAD_CENTER_LNG - ROAD_WIDTH_OFFSET,
});

// Generate Benches (15 items)
const BENCH_COUNT = 15;
const latStep = (ROAD_NORTH - ROAD_SOUTH) / (BENCH_COUNT + 1);

const benches: Facility[] = Array.from({ length: BENCH_COUNT }).map((_, i) => {
  const lat = ROAD_NORTH - latStep * (i + 1);
  const side = i % 2 === 0 ? 'east' : 'west';
  return createBench(i + 1, lat, side);
});

// Generate Toilets (4 strategic locations)
const toilets: Facility[] = [
  createToilet(1, 33.5640, 'west'), // Near 6-chome
  createToilet(2, 33.5610, 'east'), // Near 4-chome
  createToilet(3, 33.5580, 'west'), // Near 2-chome
  createToilet(4, 33.5545, 'east'), // Near 1-chome
];

export const facilities: Facility[] = [...toilets, ...benches];
