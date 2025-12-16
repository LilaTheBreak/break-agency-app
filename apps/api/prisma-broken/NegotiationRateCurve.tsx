import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RateCurvePanelProps {
  sessionId: string;
}

export default function NegotiationRateCurve({ sessionId }: RateCurvePanelProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    // Initial fetch if data already exists
    fetch(`/api/negotiation/${sessionId}/rate-prediction`).then(res => res.json()).then(setSession);
  }, [sessionId]);

  const handlePredict = async () => {
    setLoading(true);
    const res = await fetch(`/api/negotiation/${sessionId}/predict-rate`, { method: 'POST' });
    if (res.ok) {
      setSession(await res.json());
    } else {
      alert('Failed to run rate prediction.');
    }
    setLoading(false);
  };

  if (!session && !loading) {
    return (
      <div className="p-6 text-center">
        <button onClick={handlePredict} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md">
          Run AI Rate Prediction
        </button>
      </div>
    );
  }

  if (loading || !session?.aiRateCurve) {
    return <div className="p-6 text-center">AI is calculating budget probabilities...</div>;
  }

  const { aiRateCurve, aiRecommendedCounter, aiPredictedMaxBudget } = session;
  const chartData = aiRateCurve.map((point: any) => ({
    fee: point.fee,
    'Acceptance Probability': point.probability * 100,
  }));

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <header className="mb-6">
        <h2 className="text-xl font-bold">AI Rate Prediction Curve</h2>
        <p className="text-sm text-gray-500">Predicted brand willingness to accept different counter-offers.</p>
      </header>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fee" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(value) => `£${value / 1000}k`} />
            <YAxis unit="%" domain={[0, 100]} />
            <Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} />
            <Legend />
            <Line type="monotone" dataKey="Acceptance Probability" stroke="#8884d8" strokeWidth={2} />
            {aiRecommendedCounter && (
              <ReferenceLine x={aiRecommendedCounter} stroke="green" strokeDasharray="3 3" label={{ value: 'Recommended Counter', position: 'insideTopRight', fill: 'green' }} />
            )}
            {aiPredictedMaxBudget && (
              <ReferenceLine x={aiPredictedMaxBudget} stroke="red" strokeDasharray="3 3" label={{ value: 'Predicted Max Budget', position: 'insideBottomRight', fill: 'red' }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}