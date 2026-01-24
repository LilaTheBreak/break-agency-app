import React, { useState, useEffect } from 'react';
import { Link2, Trash2, Edit2, Plus } from 'lucide-react';
import Button, { SecondaryButton, DangerButton } from './Button.jsx';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../services/apiClient.js';

const REPRESENTATION_TYPES = [
  { value: 'EXCLUSIVE', label: 'Exclusive Talent' },
  { value: 'NON_EXCLUSIVE', label: 'Non-Exclusive' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'UGC', label: 'UGC (User Generated Content)' },
  { value: 'OTHER', label: 'Other' },
];

const ACCESS_ROLES = [
  { value: 'VIEW', label: 'View Only' },
  { value: 'MANAGE', label: 'Can Manage' },
];

/**
 * Modal to add or edit a linked user account
 */
function LinkedAccountModal({ isOpen, onClose, talentId, existingAccount = null, onSave }) {
  const [formData, setFormData] = useState({
    userId: existingAccount?.userId || '',
    role: existingAccount?.role || 'VIEW',
    representationType: existingAccount?.representationType || 'NON_EXCLUSIVE',
    notes: existingAccount?.notes || '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (isOpen && !existingAccount) {
      loadUsers();
    }
  }, [isOpen, existingAccount]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId && !existingAccount) {
      toast.error('Please select a user');
      return;
    }

    try {
      setLoading(true);
      const method = existingAccount ? 'PATCH' : 'POST';
      const url = existingAccount
        ? `/api/admin/talent/${talentId}/linked-users/${existingAccount.id}`
        : `/api/admin/talent/${talentId}/linked-users`;

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...(method === 'POST' && { userId: formData.userId }),
          role: formData.role,
          representationType: formData.representationType,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save linked account');
      }

      const data = await response.json();
      toast.success(existingAccount ? 'Account updated' : 'Account linked');
      onSave(data.linkedAccount);
      onClose();
    } catch (error) {
      console.error('Error saving linked account:', error);
      toast.error(error.message || 'Failed to save linked account');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.email} ${user.name || ''}`.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-brand-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {existingAccount ? 'Edit Linked Account' : 'Link User Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          {!existingAccount && (
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
                User
              </label>
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm mb-2"
              />
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm"
              >
                <option value="">Select a user...</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email} {user.name ? `(${user.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Representation Type */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
              Representation Type
            </label>
            <select
              value={formData.representationType}
              onChange={(e) => setFormData({ ...formData, representationType: e.target.value })}
              className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm"
            >
              {REPRESENTATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Access Role */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
              Access Level
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm"
            >
              {ACCESS_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-brand-black/60 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this user's relationship..."
              className="w-full rounded-lg border border-brand-black/10 px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <SecondaryButton
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </SecondaryButton>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : existingAccount ? 'Update' : 'Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Main component for managing multiple linked user accounts
 */
export function LinkedUserAccountsManager({ talentId }) {
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    loadLinkedAccounts();
  }, [talentId]);

  const loadLinkedAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/talent/${talentId}/linked-users`);
      if (!response.ok) throw new Error('Failed to load linked accounts');
      const data = await response.json();
      setLinkedAccounts(data.linkedAccounts || []);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
      toast.error('Failed to load linked accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to unlink this account?')) return;

    try {
      const response = await apiFetch(
        `/api/admin/talent/${talentId}/linked-users/${accountId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete linked account');
      
      setLinkedAccounts(linkedAccounts.filter(acc => acc.id !== accountId));
      toast.success('Account unlinked');
    } catch (error) {
      console.error('Failed to delete linked account:', error);
      toast.error('Failed to unlink account');
    }
  };

  const handleSaveAccount = (savedAccount) => {
    if (editingAccount) {
      setLinkedAccounts(
        linkedAccounts.map(acc => acc.id === savedAccount.id ? savedAccount : acc)
      );
    } else {
      setLinkedAccounts([savedAccount, ...linkedAccounts]);
    }
  };

  const getRepresentationTypeLabel = (type) => {
    return REPRESENTATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getAccessRoleLabel = (role) => {
    return ACCESS_ROLES.find(r => r.value === role)?.label || role;
  };

  if (loading) {
    return <div className="text-sm text-brand-black/60">Loading linked accounts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-black">
            Linked User Accounts ({linkedAccounts.length})
          </h3>
          <p className="text-xs text-brand-black/60 mt-1">
            Manage users with access to this talent profile
          </p>
        </div>
        <Button
          onClick={handleAddAccount}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Link Account
        </Button>
      </div>

      {linkedAccounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-black/20 p-6 text-center">
          <Link2 className="h-8 w-8 mx-auto text-brand-black/40 mb-2" />
          <p className="text-sm text-brand-black/60">
            No linked user accounts yet. Add one to enable access.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedAccounts.map(account => (
            <div
              key={account.id}
              className="rounded-lg border border-brand-black/10 bg-brand-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-brand-black truncate">
                      {account.user.email}
                    </p>
                    {account.user.name && (
                      <span className="text-xs text-brand-black/60">
                        ({account.user.name})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-block px-2 py-1 rounded-full bg-brand-red/10 text-xs font-medium text-brand-red">
                      {getRepresentationTypeLabel(account.representationType)}
                    </span>
                    <span className="inline-block px-2 py-1 rounded-full bg-brand-black/10 text-xs font-medium text-brand-black">
                      {getAccessRoleLabel(account.role)}
                    </span>
                    {account.status === 'INACTIVE' && (
                      <span className="inline-block px-2 py-1 rounded-full bg-brand-black/5 text-xs font-medium text-brand-black/60">
                        Inactive
                      </span>
                    )}
                  </div>

                  {account.notes && (
                    <p className="text-xs text-brand-black/60 mb-2">
                      {account.notes}
                    </p>
                  )}

                  <p className="text-xs text-brand-black/40">
                    Linked {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditAccount(account)}
                    className="p-2 rounded-lg hover:bg-brand-black/5 transition-colors"
                    title="Edit account"
                  >
                    <Edit2 className="h-4 w-4 text-brand-black/60" />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Unlink account"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <LinkedAccountModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        talentId={talentId}
        existingAccount={editingAccount}
        onSave={handleSaveAccount}
      />
    </div>
  );
}

export default LinkedUserAccountsManager;
