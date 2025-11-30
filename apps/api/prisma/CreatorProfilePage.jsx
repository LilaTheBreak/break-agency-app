import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UpgradeBanner from '../../components/billing/UpgradeBanner'; // Assuming this component exists

const CreatorProfileLocked = ({ profile }) => (
  <div className="relative max-w-4xl mx-auto">
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg blur-sm select-none">
      <div className="flex items-center gap-6">
        <img src={profile.avatarUrl || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-full object-cover" />
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-lg text-gray-500 capitalize">{profile.roster_category?.replace('_', ' ')}</p>
        </div>
      </div>
      <div className="mt-6 border-t pt-6">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="mt-2 text-gray-600">{profile.bioSnippet}</p>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center bg-black bg-opacity-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-white">Unlock Full Profile</h2>
        <p className="text-white my-4">Upgrade to a Premium plan to view full analytics, contact information, and more.</p>
        <UpgradeBanner plan="brand_premium" featureName="Full Creator Profiles" />
      </div>
    </div>
  </div>
);

const CreatorProfileFull = ({ profile }) => (
  <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <img src={profile.avatarUrl || 'https://via.placeholder.com/150'} alt={profile.name} className="w-32 h-32 rounded-full object-cover" />
      <div>
        <h1 className="text-3xl font-bold">{profile.name}</h1>
        <p className="text-lg text-gray-500 capitalize">{profile.roster_category?.replace('_', ' ')}</p>
        <div className="flex gap-4 mt-2">
          {profile.socialAccounts.map(acc => (
            <a key={acc.platform} href={acc.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {acc.platform} ({Math.round(acc.followers / 1000)}k)
            </a>
          ))}
        </div>
      </div>
    </div>
    <div className="mt-6 border-t pt-6">
      <h2 className="text-xl font-semibold">About</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{profile.bio}</p>
    </div>
    {/* Add more sections for analytics, portfolio, etc. */}
  </div>
);

export default function CreatorProfilePage() {
  const { creatorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/brand/discovery/profile/${creatorId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch profile.');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [creatorId]);

  if (loading) return <div className="p-8 text-center">Loading Profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return <div className="p-8 text-center">Profile not found.</div>;

  return (
    <div className="p-8">
      {profile.locked ? (
        <CreatorProfileLocked profile={profile} />
      ) : (
        <CreatorProfileFull profile={profile} />
      )}
    </div>
  );
}