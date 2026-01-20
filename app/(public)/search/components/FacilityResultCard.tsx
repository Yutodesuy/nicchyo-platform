'use client';

import { useRouter } from 'next/navigation';
import { Facility } from '../../map/data/facilities';
import { MapPin, Armchair } from 'lucide-react';

interface FacilityResultCardProps {
  facility: Facility;
}

export default function FacilityResultCard({ facility }: FacilityResultCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/map?lat=${facility.lat}&lng=${facility.lng}&zoom=19`);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${facility.type === 'toilet' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'}`}>
            {facility.type === 'toilet' ? (
              <span className="font-bold text-sm">WC</span>
            ) : (
              <Armchair className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{facility.name}</h3>
            <p className="text-xs text-gray-500">{facility.type === 'toilet' ? '公衆トイレ' : '休憩所'}</p>
          </div>
        </div>
      </div>
      <button
        onClick={handleClick}
        className="w-full rounded-lg bg-gray-50 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        マップで見る
      </button>
    </div>
  );
}
