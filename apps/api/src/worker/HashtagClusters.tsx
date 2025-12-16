import React from 'react';
import HashtagDifficultyBadge from './HashtagDifficultyBadge';

interface HashtagClustersProps {
  clusters: Record<string, string[]>;
  difficultyMap: Record<string, string>;
}

export default function HashtagClusters({ clusters, difficultyMap }: HashtagClustersProps) {
  if (!clusters) return null;

  return (
    <div className="space-y-4">
      {Object.entries(clusters).map(([clusterName, tags]) => (
        <div key={clusterName}>
          <h4 className="text-sm font-semibold capitalize mb-2">{clusterName}</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <span className="text-sm">{tag}</span>
                <HashtagDifficultyBadge difficulty={difficultyMap?.[tag]} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}