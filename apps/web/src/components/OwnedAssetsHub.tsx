import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import SkeletonLoader from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

interface OwnedAsset {
  id: string;
  talentId: string;
  type: 'EMAIL_LIST' | 'COMMUNITY' | 'COURSE' | 'SAAS' | 'DOMAIN' | 'TRADEMARK' | 'DATA' | 'OTHER';
  name: string;
  description: string;
  estimatedValue: number;
  monthlyRevenue: number;
  yearAcquired: number;
  isProtected: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

interface InventorySummary {
  totalAssets: number;
  totalValue: number;
  totalMonthlyRevenue: number;
  protectedAssetsCount: number;
  assetsByType: Record<string, number>;
  valueByType: Record<string, number>;
}

interface Props {
  talentId: string;
  onLoadingChange?: (loading: boolean) => void;
}

const ASSET_TYPES = [
  { value: 'EMAIL_LIST', label: 'Email List', icon: '📧', color: 'bg-blue-100' },
  { value: 'COMMUNITY', label: 'Community', icon: '👥', color: 'bg-purple-100' },
  { value: 'COURSE', label: 'Course', icon: '📚', color: 'bg-green-100' },
  { value: 'SAAS', label: 'SaaS Product', icon: '⚙️', color: 'bg-orange-100' },
  { value: 'DOMAIN', label: 'Domain/Brand', icon: '🌐', color: 'bg-indigo-100' },
  { value: 'TRADEMARK', label: 'Trademark', icon: '™️', color: 'bg-pink-100' },
  { value: 'DATA', label: 'Data/IP', icon: '📊', color: 'bg-yellow-100' },
  { value: 'OTHER', label: 'Other', icon: '📦', color: 'bg-gray-100' },
];

const OwnedAssetsHub: React.FC<Props> = ({ talentId, onLoadingChange }) => {
  const [assets, setAssets] = useState<OwnedAsset[]>([]);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<OwnedAsset | null>(null);
  const [formData, setFormData] = useState({
    type: 'EMAIL_LIST',
    name: '',
    description: '',
    estimatedValue: 0,
    monthlyRevenue: 0,
    yearAcquired: new Date().getFullYear(),
    isProtected: false,
    status: 'ACTIVE',
  });

  // Fetch assets and inventory
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = selectedTypeFilter !== 'ALL' ? `?type=${selectedTypeFilter}` : '';
      const response = await fetch(`/api/owned-assets/${talentId}${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const data = await response.json();
      setAssets(data);

      // Fetch inventory summary
      const inventoryResponse = await fetch(`/api/owned-assets/${talentId}/inventory`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [talentId, selectedTypeFilter]);

  const handleCreateAsset = async () => {
    try {
      const response = await fetch(`/api/owned-assets/${talentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create asset');
      }

      setShowCreateModal(false);
      setFormData({
        type: 'EMAIL_LIST',
        name: '',
        description: '',
        estimatedValue: 0,
        monthlyRevenue: 0,
        yearAcquired: new Date().getFullYear(),
        isProtected: false,
        status: 'ACTIVE',
      });
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    try {
      const response = await fetch(`/api/owned-assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update asset');
      }

      setEditingAsset(null);
      setFormData({
        type: 'EMAIL_LIST',
        name: '',
        description: '',
        estimatedValue: 0,
        monthlyRevenue: 0,
        yearAcquired: new Date().getFullYear(),
        isProtected: false,
        status: 'ACTIVE',
      });
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/owned-assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  const openEditModal = (asset: OwnedAsset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type,
      name: asset.name,
      description: asset.description,
      estimatedValue: asset.estimatedValue,
      monthlyRevenue: asset.monthlyRevenue,
      yearAcquired: asset.yearAcquired,
      isProtected: asset.isProtected,
      status: asset.status,
    });
  };

  const getAssetTypeInfo = (type: string) =>
    ASSET_TYPES.find((t) => t.value === type) || ASSET_TYPES[ASSET_TYPES.length - 1];

  if (loading) {
    return <SkeletonLoader count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error Loading Assets</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const filteredAssets = selectedTypeFilter === 'ALL'
    ? assets
    : assets.filter((a) => a.type === selectedTypeFilter);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Owned Assets & IP Hub</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage all owned assets that contribute to business value
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAsset(null);
              setFormData({
                type: 'EMAIL_LIST',
                name: '',
                description: '',
                estimatedValue: 0,
                monthlyRevenue: 0,
                yearAcquired: new Date().getFullYear(),
                isProtected: false,
                status: 'ACTIVE',
              });
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Add Asset
          </button>
        </div>

        {/* Inventory Summary */}
        {inventory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 font-medium">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{inventory.totalAssets}</p>
              <p className="text-xs text-gray-500 mt-1">{inventory.protectedAssetsCount} protected</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ${inventory.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Combined valuation</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                ${inventory.totalMonthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">From owned assets</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 font-medium">Protection Rate</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {inventory.totalAssets > 0
                  ? ((inventory.protectedAssetsCount / inventory.totalAssets) * 100).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500 mt-1">IP protection</p>
            </div>
          </div>
        )}

        {/* Asset Type Breakdown */}
        {inventory && Object.keys(inventory.valueByType).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Value by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ASSET_TYPES.map((assetType) => {
                const count = inventory.assetsByType[assetType.value] || 0;
                const value = inventory.valueByType[assetType.value] || 0;
                return (
                  <div key={assetType.value} className={`${assetType.color} rounded-lg p-4`}>
                    <div className="text-2xl mb-2">{assetType.icon}</div>
                    <h4 className="font-semibold text-gray-900 text-sm">{assetType.label}</h4>
                    <p className="text-xs text-gray-600 mt-1">{count} asset{count !== 1 ? 's' : ''}</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
              selectedTypeFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Assets
          </button>
          {ASSET_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedTypeFilter(type.value)}
              className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                selectedTypeFilter === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredAssets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Value</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Monthly Revenue</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Protection</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const assetType = getAssetTypeInfo(asset.type);
                    return (
                      <tr key={asset.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{assetType.icon}</span>
                            <div>
                              <p className="font-medium text-gray-900">{asset.name}</p>
                              <p className="text-xs text-gray-500">{asset.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{assetType.label}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          ${asset.estimatedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          ${asset.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              asset.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : asset.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {asset.isProtected ? (
                            <span className="text-sm text-green-600 font-semibold">✓ Protected</span>
                          ) : (
                            <span className="text-sm text-orange-600 font-semibold">⚠ Unprotected</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditModal(asset)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No assets found. Create your first asset to get started.</p>
            </div>
          )}
        </div>

        {/* Create/Edit Asset Modal */}
        <Modal
          isOpen={showCreateModal || editingAsset !== null}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAsset(null);
          }}
          title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., YouTube Channel, Email List, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this asset..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value ($)</label>
                <input
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue ($)</label>
                <input
                  type="number"
                  value={formData.monthlyRevenue}
                  onChange={(e) => setFormData({ ...formData, monthlyRevenue: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Acquired</label>
              <input
                type="number"
                value={formData.yearAcquired}
                onChange={(e) => setFormData({ ...formData, yearAcquired: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isProtected"
                checked={formData.isProtected}
                onChange={(e) => setFormData({ ...formData, isProtected: e.target.checked })}
                className="w-4 h-4 border border-gray-300 rounded"
              />
              <label htmlFor="isProtected" className="text-sm font-medium text-gray-700">
                IP Protected (Trademark, Patent, Copyright, etc.)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAsset(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingAsset ? handleUpdateAsset : handleCreateAsset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {editingAsset ? 'Update Asset' : 'Create Asset'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default OwnedAssetsHub;
