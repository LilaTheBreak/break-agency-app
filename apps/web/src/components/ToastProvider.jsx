import { Toaster } from 'react-hot-toast';

/**
 * ToastProvider - Global toast notification system
 * 
 * Displays error and success notifications throughout the app.
 * Automatically integrated with API error handling.
 * 
 * Toast Types:
 * - Error: Red background, used for API failures, auth errors
 * - Success: Green background, used for successful mutations
 * - Loading: Blue background, used for in-progress operations
 * 
 * Usage:
 * - Import toast from 'react-hot-toast'
 * - toast.error('Error message')
 * - toast.success('Success message')
 * - toast.loading('Loading...')
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 80, // Below header
        right: 20,
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: '#FFFCF5', // brand-linen
          color: '#0A0A0A', // brand-black
          border: '1px solid #0A0A0A',
          borderRadius: '0.5rem',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          maxWidth: '400px',
        },
        // Error toast styling
        error: {
          duration: 6000, // Longer for errors
          style: {
            background: '#DC2626', // red-600
            color: '#FFFFFF',
            border: '1px solid #DC2626',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#DC2626',
          },
        },
        // Success toast styling
        success: {
          duration: 3000, // Shorter for success
          style: {
            background: '#16A34A', // green-600
            color: '#FFFFFF',
            border: '1px solid #16A34A',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#16A34A',
          },
        },
        // Loading toast styling
        loading: {
          style: {
            background: '#2563EB', // blue-600
            color: '#FFFFFF',
            border: '1px solid #2563EB',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#2563EB',
          },
        },
      }}
    />
  );
}
