import React, { useState, useEffect } from 'react';

const PayoutRow = ({ payout }) => (
  <tr className="border-b dark:border-gray-700">
    <td className="p-3">{new Date(payout.createdAt).toLocaleDateString()}</td>
    <td className="p-3 font-semibold">£{payout.amount.toLocaleString()}</td>
    <td className="p-3">
      <span className={`px-2 py-1 text-xs rounded-full ${payout.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {payout.status}
      </span>
    </td>
    <td className="p-3 text-xs font-mono">{payout.transactionId || 'N/A'}</td>
  </tr>
);

export default function CreatorPayoutDashboard({ creatorId }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This endpoint is defined in the prompt
    fetch(`/api/payouts/${creatorId}/history`)
      .then(res => res.json())
      .then(setPayouts)
      .finally(() => setLoading(false));
  }, [creatorId]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Payouts</h1>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="p-3">Date</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3">Transaction ID</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map(payout => <PayoutRow key={payout.id} payout={payout} />)}
        </tbody>
      </table>
    </div>
  );
}