import React, { useState, useEffect } from 'react';

const FriendForm = ({ friend, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    friend || {
      name: '',
      bio: '',
      category: '',
      photoUrl: '',
      instagram: '',
      customTags: [],
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, customTags: tags }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Mock file upload handler
  const handleImageUpload = async (e) => {
    // In a real app, this would call a file service to upload the image to S3
    // and return a URL, then set it in the form state.
    alert('Image upload simulation. Set the URL manually.');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 my-6 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
      <h2 className="text-xl font-bold">{friend ? 'Edit' : 'Create'} Friend of House</h2>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
      <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" className="w-full p-2 border rounded" />
      <input name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g., Fashion, Tech)" className="w-full p-2 border rounded" />
      <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="Photo URL" className="w-full p-2 border rounded" />
      {/* <input type="file" onChange={handleImageUpload} className="w-full" /> */}
      <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram Handle (without @)" className="w-full p-2 border rounded" />
      <input name="customTags" value={formData.customTags.join(', ')} onChange={handleTagsChange} placeholder="Custom Tags (comma-separated)" className="w-full p-2 border rounded" />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 font-semibold bg-gray-200 rounded-md">Cancel</button>
      </div>
    </form>
  );
};

export default function FriendsManagerPage() {
  const [friends, setFriends] = useState([]);
  const [editingFriend, setEditingFriend] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchFriends = async () => {
    const res = await fetch('/api/admin/friends/list');
    const data = await res.json();
    setFriends(data);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSave = async (friendData) => {
    const url = friendData.id ? `/api/admin/friends/update/${friendData.id}` : '/api/admin/friends/create';
    const method = 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(friendData),
    });

    setEditingFriend(null);
    setIsCreating(false);
    fetchFriends();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    await fetch(`/api/admin/friends/delete/${id}`, { method: 'DELETE' });
    fetchFriends();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Friends of House</h1>
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          + Add New
        </button>
      </div>

      {(isCreating || editingFriend) && (
        <FriendForm
          friend={editingFriend}
          onSave={handleSave}
          onCancel={() => { setEditingFriend(null); setIsCreating(false); }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend) => (
          <div key={friend.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
            <div className="flex items-start gap-4">
              <img src={friend.photoUrl || 'https://via.placeholder.com/80'} alt={friend.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <h3 className="font-bold text-lg">{friend.name}</h3>
                <p className="text-sm font-semibold text-blue-500">{friend.category}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{friend.bio}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingFriend(friend)} className="text-xs px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
              <button onClick={() => handleDelete(friend.id)} className="text-xs px-3 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}