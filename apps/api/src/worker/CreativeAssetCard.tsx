import React from 'react';

interface Asset {
  id: string;
  type: string;
  preview: string;
  platform: string;
  talent: string;
  brand: string;
  versionCount: number;
  locked: boolean;
  deliverableId: string;
}

interface CreativeAssetCardProps {
  asset: Asset;
  onClick: (deliverableId: string) => void;
}

export default function CreativeAssetCard({ asset, onClick }: CreativeAssetCardProps) {
  return (
    <div
      onClick={() => onClick(asset.deliverableId)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{asset.type}</span>
        <span className="text-xs text-gray-400">{asset.platform}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 h-16">{asset.preview}</p>
      <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
        <span>By: {asset.talent}</span>
        <span>For: {asset.brand}</span>
      </div>
    </div>
  );
}