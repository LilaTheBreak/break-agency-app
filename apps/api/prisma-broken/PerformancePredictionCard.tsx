import React, { useState, useEffect } from 'react';

interface PredictionCardProps {
  deliverableId: string;
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center">
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const Tip = ({ tip }: { tip: string }) => (
  <li className="text-sm text-green-700 dark:text-green-300">{tip}</li>
);

export default function PerformancePredictionCard({ deliverableId }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deliverableId) return;
    fetch(`/api/deliverables/${deliverableId}/performance`)
      .then(res => res.json())
      .then(setPrediction);
  }, [deliverableId]);

  const handlePredict = async () => {
    setLoading(true);
    await fetch(`/api/deliverables/${deliverableId}/predict-performance`, { method: 'POST' });
    setTimeout(() => {
      fetch(`/api/deliverables/${deliverableId}/performance`).then(res => res.json()).then(setPrediction);
      setLoading(false);
    }, 3000); // Poll for results
  };

  if (!prediction && !loading) {
    return (
      <div className="p-6 text-center">
        <button onClick={handlePredict} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          Predict Performance
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center">AI is forecasting performance...</div>;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">AI Performance Prediction</h2>
        <div className="text-right">
          <p className="font-bold text-4xl text-green-500">{prediction.performanceScore}<span className="text-lg">/100</span></p>
          <p className="text-xs text-gray-500">Predicted Score</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
        <Stat label="Views" value={`${(prediction.predictedViews / 1000).toFixed(0)}k`} />
        <Stat label="Likes" value={`${(prediction.predictedLikes / 1000).toFixed(0)}k`} />
        <Stat label="Comments" value={prediction.predictedComments} />
        <Stat label="Shares" value={prediction.predictedShares} />
      </div>

      <div>
        <h4 className="font-semibold mb-2">Optimization Tips</h4>
        <ul className="list-disc list-inside space-y-1">
          {(prediction.improvementTips || []).map((tip: string, i: number) => <Tip key={i} tip={tip} />)}
        </ul>
      </div>
    </div>
  );
}