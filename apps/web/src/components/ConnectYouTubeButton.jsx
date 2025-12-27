import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function ConnectYouTubeButton({ onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if YouTube connection was successful
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      setIsConnected(true);
      toast.success('YouTube channel connected successfully!');
      if (onSuccess) onSuccess();
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('youtube_error')) {
      const error = params.get('youtube_error');
      const errorMessages = {
        access_denied: 'YouTube connection was cancelled',
        missing_params: 'YouTube connection failed - missing parameters',
        invalid_state: 'YouTube connection failed - invalid state',
        callback_failed: 'YouTube connection failed - please try again'
      };
      toast.error(errorMessages[error] || 'YouTube connection failed');
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check current connection status
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/analytics/socials/connections', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.connections) {
        const youtubeConnection = data.connections.find(
          conn => conn.platform === 'YOUTUBE' && conn.isActive
        );
        setIsConnected(!!youtubeConnection);
      }
    } catch (error) {
      console.error('Failed to check YouTube connection status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);

      // Get OAuth URL from backend
      const response = await fetch('/api/auth/youtube/connect', {
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.authUrl) {
        throw new Error('Failed to get YouTube authorization URL');
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.authUrl,
        'YouTube Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(pollTimer);
          setIsLoading(false);
          
          // Recheck connection status after popup closes
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000);
        }
      }, 500);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        if (popup && !popup.closed) {
          popup.close();
        }
        setIsLoading(false);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('YouTube connect error:', error);
      toast.error('Failed to connect YouTube channel');
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return <DisconnectYouTubeButton onDisconnect={() => setIsConnected(false)} />;
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      {isLoading ? 'Connecting...' : 'Connect YouTube'}
    </button>
  );
}

export function DisconnectYouTubeButton({ onDisconnect }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your YouTube channel?')) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/youtube/disconnect', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('YouTube channel disconnected');
        if (onDisconnect) onDisconnect();
      } else {
        throw new Error(data.error || 'Disconnect failed');
      }
    } catch (error) {
      console.error('YouTube disconnect error:', error);
      toast.error('Failed to disconnect YouTube channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      toast.info('Syncing YouTube data...');

      const response = await fetch('/api/auth/youtube/sync', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`YouTube data synced! ${data.videosCount} videos updated`);
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('YouTube sync error:', error);
      toast.error('Failed to sync YouTube data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        {isSyncing ? 'Syncing...' : 'Sync YouTube'}
      </button>
      
      <button
        onClick={handleDisconnect}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  );
}
