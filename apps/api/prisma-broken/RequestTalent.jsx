import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RequestTalentPage() {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    notes: '',
    budgetMin: 1000,
    budgetMax: 3000,
    timeline: '2-4 weeks',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/brand/talent-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, talentId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send request.');
      }
      alert('Talent request sent successfully!');
      navigate('/brand/talent-requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Request Talent</h1>
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <label className="text-sm font-medium">Notes for the Creator</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2 border rounded-md" rows="5" placeholder="Describe the collaboration, deliverables, and goals..." required />
        </div>
        <div>
          <label className="text-sm font-medium">Budget Range</label>
          <div className="flex gap-4">
            <input type="number" name="budgetMin" value={formData.budgetMin} onChange={handleChange} className="w-full p-2 border rounded-md" />
            <input type="number" name="budgetMax" value={formData.budgetMax} onChange={handleChange} className="w-full p-2 border rounded-md" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400">
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </form>
    </div>
  );
}