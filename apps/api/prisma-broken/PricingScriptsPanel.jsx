import React from 'react';
import { generatePricingScripts } from '../../services/pricing/scripts/pricingScripts';

export default function PricingScriptsPanel({ snapshot }) {
  // Assuming the offer from the brand is stored in the deal draft
  const theirOffer = snapshot.metadata?.theirOffer || snapshot.baseRate * 0.7;
  const scripts = generatePricingScripts({
    ourPrice: snapshot.recommended,
    theirOffer,
    justification: 'our audience engagement and market rates',
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="font-bold mb-2">Pricing Negotiation Scripts</h3>
      <div className="space-y-3">
        {Object.entries(scripts).map(([tone, script]) => (
          <div key={tone}>
            <h4 className="text-sm font-semibold capitalize">{tone}</h4>
            <p className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{script}</p>
            <button className="text-xs text-blue-500 mt-1">Insert into Reply</button>
          </div>
        ))}
      </div>
    </div>
  );
}