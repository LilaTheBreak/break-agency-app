import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Connect TikTok Button
 * Handles TikTok OAuth connection flow
 */
export function ConnectTikTokButton({ onConnect, className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/tiktok/connect', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate TikTok connection');
      }
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        'TikTok Connect',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setLoading(false);
          
          // Check URL params for success/error
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('success') === 'tiktok_connected') {
            toast.success('TikTok connected successfully!');
            onConnect?.();
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
          } else if (urlParams.get('error')) {
            const error = urlParams.get('error');
            if (error === 'tiktok_auth_denied') {
              toast.error('TikTok connection was cancelled');
            } else {
              toast.error('Failed to connect TikTok');
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
      console.error('TikTok connect failed:', error);
      toast.error(error.message || 'Failed to connect TikTok');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50 transition-colors ${className}`}
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
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
          </svg>
          Connect TikTok
        </>
      )}
    </button>
  );
}

/**
 * Disconnect TikTok Button
 * Handles TikTok account disconnection
 */
export function DisconnectTikTokButton({ onDisconnect, className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect TikTok? Your analytics data will be preserved but will not update.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/tiktok/disconnect', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to disconnect TikTok');
      }
      
      toast.success('TikTok disconnected');
      onDisconnect?.();
    } catch (error) {
      console.error('TikTok disconnect failed:', error);
      toast.error('Failed to disconnect TikTok');
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
