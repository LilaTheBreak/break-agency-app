import React, { useState, useEffect } from 'react';

const VIPForm = ({ vip, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    vip || {
      name: '',
      bio: '',
      avatarUrl: '',
      categories: [],
      instagram: '',
      tiktok: '',
      youtube: '',
      website: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (e) => {
    const categories = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, categories }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
      <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" className="w-full p-2 border rounded" />
      <input name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} placeholder="Avatar URL" className="w-full p-2 border rounded" />
      <input name="categories" value={formData.categories.join(', ')} onChange={handleCategoriesChange} placeholder="Categories (comma-separated)" className="w-full p-2 border rounded" />
      <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram URL" className="w-full p-2 border rounded" />
      <input name="tiktok" value={formData.tiktok} onChange={handleChange} placeholder="TikTok URL" className="w-full p-2 border rounded" />
      <input name="youtube" value={formData.youtube} onChange={handleChange} placeholder="YouTube URL" className="w-full p-2 border rounded" />
      <input name="website" value={formData.website} onChange={handleChange} placeholder="Website URL" className="w-full p-2 border rounded" />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 font-semibold bg-gray-200 rounded-md">Cancel</button>
      </div>
    </form>
  );
};

export default function VIPManager() {
  const [vips, setVips] = useState([]);
  const [editingVip, setEditingVip] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchVips = async () => {
    const res = await fetch('/api/vip');
    const data = await res.json();
    setVips(data);
  };

  useEffect(() => {
    fetchVips();
  }, []);

  const handleSave = async (vipData) => {
    const url = vipData.id ? `/api/admin/vip/${vipData.id}` : '/api/admin/vip';
    const method = vipData.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vipData),
    });

    setEditingVip(null);
    setIsCreating(false);
    fetchVips();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this VIP?')) return;
    await fetch(`/api/admin/vip/${id}`, { method: 'DELETE' });
    fetchVips();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage VIPs (Friends of House)</h1>
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          + Add New VIP
        </button>
      </div>

      {(isCreating || editingVip) && (
        <div className="mb-6">
          <VIPForm
            vip={editingVip}
            onSave={handleSave}
            onCancel={() => {
              setEditingVip(null);
              setIsCreating(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vips.map((vip) => (
          <div key={vip.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            <div className="flex items-start gap-4">
              <img src={vip.avatarUrl || 'https://via.placeholder.com/80'} alt={vip.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <h3 className="font-bold text-lg">{vip.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{vip.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {vip.categories.map(cat => (
                    <span key={cat} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingVip(vip)} className="text-xs px-3 py-1 bg-yellow-500 text-white rounded">
                Edit
              </button>
              <button onClick={() => handleDelete(vip.id)} className="text-xs px-3 py-1 bg-red-600 text-white rounded">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}