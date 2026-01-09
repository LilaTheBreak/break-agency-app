import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Download,
  Filter
} from "lucide-react";

/**
 * AdminRevenueDashboard
 * 
 * Displays revenue metrics derived from deal values and stages.
 * Revenue is calculated internally without payment processor integration.
 * 
 * Props:
 * - None (fetches data from API)
 */
export function AdminRevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [brandBreakdown, setBrandBreakdown] = useState([]);
  const [creatorEarnings, setCreatorEarnings] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    groupBy: "month"
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchRevenueData();
  }, [filters]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const [metricsRes, brandsRes, creatorsRes, timeSeriesRes] = await Promise.all([
        fetch(`/api/revenue/metrics?${params}`, { credentials: "include" }),
        fetch(`/api/revenue/by-brand?${params}`, { credentials: "include" }),
        fetch(`/api/revenue/creator-earnings?${params}`, { credentials: "include" }),
        fetch(`/api/revenue/time-series?${params}&groupBy=${filters.groupBy}`, { credentials: "include" })
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrandBreakdown(data.data);
      }

      if (creatorsRes.ok) {
        const data = await creatorsRes.json();
        setCreatorEarnings(data.data);
      }

      if (timeSeriesRes.ok) {
        const data = await timeSeriesRes.json();
        setTimeSeries(data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "£0";
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
    return `£${amount.toFixed(0).toLocaleString("en-GB")}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Deal-based revenue tracking and projections</p>
        </div>
        <button
          onClick={() => {/* TODO: Export functionality */}}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="End date"
          />
          <select
            value={filters.groupBy}
            onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <button
            onClick={() => setFilters({ startDate: "", endDate: "", groupBy: "month" })}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Projected Revenue"
          value={formatCurrency(metrics?.projected)}
          description="Deals in negotiation"
          icon={TrendingUp}
          color="blue"
          dealCount={metrics?.dealCount?.projected}
        />
        <MetricCard
          label="Contracted Revenue"
          value={formatCurrency(metrics?.contracted)}
          description="Signed but unpaid"
          icon={DollarSign}
          color="yellow"
          dealCount={metrics?.dealCount?.contracted}
        />
        <MetricCard
          label="Paid Revenue"
          value={formatCurrency(metrics?.paid)}
          description="Manually confirmed"
          icon={Calendar}
          color="green"
          dealCount={metrics?.dealCount?.paid}
        />
        <MetricCard
          label="Total Pipeline"
          value={formatCurrency(metrics?.total)}
          description="All revenue states"
          icon={BarChart3}
          color="purple"
          dealCount={metrics?.dealCount?.total}
        />
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 mt-1">ℹ️</div>
          <div>
            <p className="font-medium text-amber-900">Revenue Calculation Method</p>
            <p className="text-sm text-amber-800 mt-1">
              All revenue is calculated from deal values and stages. "Paid" revenue must be manually updated by
              moving deals to <span className="font-mono bg-amber-100 px-1 rounded">PAYMENT_RECEIVED</span> or{" "}
              <span className="font-mono bg-amber-100 px-1 rounded">COMPLETED</span> stage. No automatic payment
              tracking is enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 border-b-2 font-medium ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Time Series
          </button>
          <button
            onClick={() => setActiveTab("brands")}
            className={`pb-4 border-b-2 font-medium ${
              activeTab === "brands"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            By Brand
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className={`pb-4 border-b-2 font-medium ${
              activeTab === "creators"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Creator Earnings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <TimeSeriesChart data={timeSeries} formatCurrency={formatCurrency} />
      )}

      {activeTab === "brands" && (
        <BrandBreakdownTable data={brandBreakdown} formatCurrency={formatCurrency} />
      )}

      {activeTab === "creators" && (
        <CreatorEarningsTable data={creatorEarnings} formatCurrency={formatCurrency} />
      )}
    </div>
  );
}

function MetricCard({ label, value, description, icon: Icon, color, dealCount }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600"
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">
          {description} • {dealCount} {dealCount === 1 ? "deal" : "deals"}
        </p>
      </div>
    </div>
  );
}

function TimeSeriesChart({ data, formatCurrency }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No time series data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.projected + d.contracted + d.paid));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
      <div className="space-y-4">
        {data.map((point, idx) => {
          const total = point.projected + point.contracted + point.paid;
          const projectedWidth = (point.projected / maxValue) * 100;
          const contractedWidth = (point.contracted / maxValue) * 100;
          const paidWidth = (point.paid / maxValue) * 100;

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{point.date}</span>
                <span className="text-sm text-gray-600">{formatCurrency(total)}</span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                {projectedWidth > 0 && (
                  <div
                    className="bg-blue-500"
                    style={{ width: `${projectedWidth}%` }}
                    title={`Projected: ${formatCurrency(point.projected)}`}
                  />
                )}
                {contractedWidth > 0 && (
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${contractedWidth}%` }}
                    title={`Contracted: ${formatCurrency(point.contracted)}`}
                  />
                )}
                {paidWidth > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${paidWidth}%` }}
                    title={`Paid: ${formatCurrency(point.paid)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">Projected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-600">Contracted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600">Paid</span>
        </div>
      </div>
    </div>
  );
}

function BrandBreakdownTable({ data, formatCurrency }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No brand data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Projected</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contracted</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((brand, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{brand.brandName}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(brand.projected)}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(brand.contracted)}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(brand.paid)}</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(brand.total)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{brand.dealCount.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreatorEarningsTable({ data, formatCurrency }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No creator earnings data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Projected</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contracted</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Deal</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((creator, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {creator.creatorName || "Unknown Creator"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(creator.projected)}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(creator.contracted)}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(creator.paid)}</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(creator.total)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">
                {formatCurrency(creator.averageDealValue)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">{creator.dealCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
