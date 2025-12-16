import React from 'react';

const StatCard = ({ title, value, children }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {children}
  </div>
);

const mockInvoices = [
  { id: 'INV-001', xeroId: 'XERO123', brandName: 'Brand A', amount: 5000, status: 'paid' },
  { id: 'INV-002', xeroId: 'XERO124', brandName: 'Brand B', amount: 7500, status: 'submitted' },
  { id: 'INV-003', xeroId: 'XERO125', brandName: 'Brand C', amount: 2500, status: 'overdue' },
];

const mockPayouts = [
  { id: 'PAY-001', amount: 4000, status: 'completed', date: '2023-10-15' },
  { id: 'PAY-002', amount: 6000, status: 'processing', date: '2023-11-01' },
];

export default function BillingPage() {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Billing & Payouts</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-sm font-medium border rounded-md">Sync with Xero</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">Generate Invoice</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Outstanding Invoices" value="£10,000" />
        <StatCard title="Creator Balance (Available)" value="£6,000" />
        <StatCard title="Next Payout" value="£6,000" />
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Invoices</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {mockInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{inv.xeroId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{inv.brandName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">£{inv.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout History and AI Reminders Log would be similar table components */}

      </div>
    </div>
  );
}