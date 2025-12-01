import React, { useState } from 'react';
import CreativeAssetCard from './CreativeAssetCard';
import CreativeEditor from '../creative/CreativeEditor';

export default function CreativeGrid({ assets }) {
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);

  const handleCardClick = (deliverableId: string) => {
    setEditingDeliverableId(deliverableId);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map(asset => (
          <CreativeAssetCard key={asset.id} asset={asset} onClick={handleCardClick} />
        ))}
      </div>
      {editingDeliverableId && (
        <CreativeEditor deliverableId={editingDeliverableId} onClose={() => setEditingDeliverableId(null)} />
      )}
    </>
  );
}