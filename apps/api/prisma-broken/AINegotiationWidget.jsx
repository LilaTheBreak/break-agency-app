import React, { useState } from 'react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
      active
        ? 'border-b-2 border-blue-500 text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

const StrategyPathCard = ({ path }) => (
  <div className="border p-4 rounded-lg">
    <h4 className="font-bold text-md">{path.pathType}</h4>
    <p className="text-xs text-gray-500">Confidence: {path.confidence * 100}%</p>
    <p className="mt-2 text-sm italic">"{path.script}"</p>
    <div className="mt-2 text-xs">
      <p>Predicted Outcome: ${path.predictedOutcome.dealValue} in {path.predictedOutcome.closeTimeDays} days.</p>
    </div>
  </div>
);

export default function AINegotiationWidget({ analysisResult }) {
  const [activeTab, setActiveTab] = useState('strategy');

  if (!analysisResult) {
    return <div className="p-4 bg-gray-100 rounded-lg">Run analysis to see AI insights.</div>;
  }

  const { strategyPaths, toneProfiles } = analysisResult;
  const toneProfile = toneProfiles?.[0];

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-lg">
      <div className="border-b flex flex-wrap">
        <TabButton active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')}>
          Strategy Paths
        </TabButton>
        <TabButton active={activeTab === 'tone'} onClick={() => setActiveTab('tone')}>
          Brand Tone
        </TabButton>
        <TabButton active={activeTab === 'reply'} onClick={() => setActiveTab('reply')}>
          Suggested Reply
        </TabButton>
        <TabButton active={activeTab === 'auto'} onClick={() => setActiveTab('auto')}>
          Auto-Agent
        </TabButton>
      </div>

      <div className="p-4">
        {activeTab === 'strategy' && (
          <div>
            <h3 className="font-semibold mb-2">Recommended Negotiation Paths</h3>
            <div className="space-y-4">
              {strategyPaths.map(path => (
                <StrategyPathCard key={path.pathType} path={path} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tone' && toneProfile && (
          <div>
            <h3 className="font-semibold mb-2">Brand Tone Analysis</h3>
            <p><strong>Detected Tone:</strong> {toneProfile.tone}</p>
            <ul className="list-disc list-inside mt-2 text-sm">
              {Object.entries(toneProfile.traits).map(([trait, value]) => (
                <li key={trait}>{trait.replace('_', ' ')}: {(value * 100).toFixed(0)}%</li>
              ))}
            </ul>
            <p className="mt-2 text-sm"><strong>Recommended Approach:</strong> {toneProfile.strategy.recommended_approach}</p>
          </div>
        )}

        {activeTab === 'reply' && (
           <div>
            <h3 className="font-semibold mb-2">Suggested Email Reply</h3>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <p className="text-sm font-mono whitespace-pre-wrap">
                {strategyPaths.find(p => p.pathType === 'Balanced')?.script || 'No script available.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'auto' && (
          <div>
            <h3 className="font-semibold mb-2">Auto-Agent Control</h3>
            <p className="text-sm mb-4">Allow the AI agent to automatically handle the next step of this negotiation.</p>
            <button className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md disabled:bg-gray-400" disabled>
              Run Auto-Agent (Requires Policy Approval)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}