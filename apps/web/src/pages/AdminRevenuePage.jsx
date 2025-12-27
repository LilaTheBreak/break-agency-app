import React from "react";
import { AdminRevenueDashboard } from "../components/AdminRevenueDashboard";

/**
 * AdminRevenuePage
 * 
 * Standalone page for revenue dashboard.
 * Can be accessed via /admin/revenue route.
 * 
 * Integration example:
 * - Add route in App.jsx: <Route path="/admin/revenue" element={<AdminRevenuePage />} />
 * - Add navigation link in admin sidebar
 */
export function AdminRevenuePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminRevenueDashboard />
    </div>
  );
}

export default AdminRevenuePage;
