import React from 'react';
import PredictionBreakdown from './PredictionBreakdown';

interface PredictionCardProps {
  deliverableId: string;
}

export default function PredictionCard({ deliverableId }: PredictionCardProps) {
  const [prediction, setPrediction] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverableId }),
      });
      const data = await res.json();
      setPrediction(data);
    } finally {
      setLoading(false);
    }
  };

  if (!prediction && !loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <h3 className="font-semibold mb-2">AI Performance Prediction</h3>
        <button onClick={handleGenerate} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md">
          Generate Prediction
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-4">Generating prediction...</div>;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="font-semibold mb-2">AI Performance Prediction (v{prediction.modelVersion})</h3>
      <PredictionBreakdown prediction={prediction} />
      {/* Add other components like BenchmarkComparison here */}
    </div>
  );
}