import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StatusMessage = ({ children }) => (
  <p className="mt-8 text-lg text-gray-500 dark:text-gray-400">{children}</p>
);

export default function CreatorAssessmentPage() {
  const [status, setStatus] = useState('Analyzing your creator profile...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const runAssessment = async () => {
      try {
        setStatus('Calculating your creator score...');
        const res = await fetch('/api/onboarding/score', { method: 'POST' });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to assess profile.');
        }

        const { category } = await res.json();
        setStatus(`Assessment complete! You've been classified as: ${category}.`);

        // Redirect based on classification
        setTimeout(() => {
          if (category === 'UGC') {
            // Route to UGC subscription page
            navigate('/subscribe/ugc');
          } else {
            // Route to dashboard for Talent/Exclusive
            navigate('/dashboard');
          }
        }, 2500);
      } catch (err) {
        setError(err.message);
        setStatus('An error occurred during assessment.');
      }
    };

    runAssessment();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Creator Assessment
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          We're running our AI analysis to find the best fit for you at The Break.
        </p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce [animation-delay:-.5s]"></div>
        </div>
        <StatusMessage>{error || status}</StatusMessage>
      </div>
    </div>
  );
}