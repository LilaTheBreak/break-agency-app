import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Connect Instagram Button
 * Handles Instagram OAuth connection flow
 * 
 * IMPORTANT FOR APP REVIEW:
 * - Uses Instagram Graph API in READ-ONLY mode
 * - Does NOT post content, send messages, run ads, or modify accounts
 * - Only accesses profile information and analytics data
 */
export function ConnectInstagramButton({ onConnect, className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/instagram/connect', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate Instagram connection');
      }
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'Instagram Connect',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setLoading(false);
          
          // Check URL params for success/error
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('success') === 'instagram_connected') {
            toast.success('Instagram connected successfully!');
            onConnect?.();
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
          } else if (urlParams.get('error')) {
            const error = urlParams.get('error');
            if (error === 'instagram_auth_denied') {
              toast.error('Instagram connection was cancelled');
            } else {
              toast.error('Failed to connect Instagram');
            }
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!popup?.closed) {
          popup?.close();
          clearInterval(checkInterval);
          setLoading(false);
          toast.error('Connection timeout');
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Instagram connect failed:', error);
      toast.error(error.message || 'Failed to connect Instagram');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity ${className}`}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Connect Instagram
        </>
      )}
    </button>
  );
}

/**
 * Disconnect Instagram Button
 * Handles Instagram account disconnection
 */
export function DisconnectInstagramButton({ onDisconnect, className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Instagram? Your analytics data will be preserved but will not update.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/instagram/disconnect', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect Instagram');
      }
      
      toast.success('Instagram disconnected');
      onDisconnect?.();
    } catch (error) {
      console.error('Instagram disconnect failed:', error);
      toast.error('Failed to disconnect Instagram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className={`text-sm text-brand-red hover:underline disabled:opacity-50 ${className}`}
    >
      {loading ? 'Disconnecting...' : 'Disconnect'}
    </button>
  );
}
