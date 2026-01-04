import React from 'react';
import { Link } from 'react-router-dom';

export default function UgcDashboardPage() {
  // In a real app, you'd fetch active requests, deliverables, etc.
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">UGC Creator Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/ugc/listing/edit" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg">
          <h2 className="font-bold text-xl">My Listing</h2>
          <p className="text-sm text-gray-500">Manage your public portfolio and packages.</p>
        </Link>
        <Link to="/ugc/requests" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg">
          <h2 className="font-bold text-xl">Brand Requests</h2>
          <p className="text-sm text-gray-500">View and respond to incoming opportunities.</p>
        </Link>
      </div>
    </div>
  );
}

