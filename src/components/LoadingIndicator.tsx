'use client'

import { useTranslations } from 'next-intl';

interface LoadingIndicatorProps {
  count?: number;
}

export const LoadingIndicator = ({ count = 6 }: LoadingIndicatorProps) => {
  const t = useTranslations('common');
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-line bg-[#FBFAF5]">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-3.5 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-6 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
};