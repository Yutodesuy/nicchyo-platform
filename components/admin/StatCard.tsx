import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  bgColor: string;
  textColor: string;
}

export const StatCard = React.memo(function StatCard({
  title,
  value,
  icon,
  bgColor,
  textColor,
}: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-6 shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className="text-4xl" aria-hidden="true">
          {icon}
        </div>
      </div>
    </div>
  );
});
