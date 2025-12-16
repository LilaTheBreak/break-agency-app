import React, { useState, useEffect } from 'react';

const HistoryItem = ({ item }) => (
  <li className="border-l-2 pl-4 pb-4">
    <p className="font-semibold">{item.status.toUpperCase()}</p>
    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
  </li>
);

export default function InvoiceStatus({ invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    fetch(`/api/invoices/${invoiceId}/status`)
      .then(res => res.json())
      .then(setInvoice)
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) return <div className="p-6">Loading invoice status...</div>;
  if (!invoice) return <div className="p-6">No invoice found.</div>;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <header className="mb-4">
        <h2 className="text-xl font-bold">Invoice Status for {invoice.brandName}</h2>
        <p className="text-sm">Amount: £{invoice.amount.toLocaleString()} - Status: <span className="font-bold">{invoice.status}</span></p>
      </header>
      <div>
        <h3 className="font-semibold mb-2">History</h3>
        <ul>
          {(invoice.history || []).map(item => <HistoryItem key={item.id} item={item} />)}
        </ul>
      </div>
    </div>
  );
}