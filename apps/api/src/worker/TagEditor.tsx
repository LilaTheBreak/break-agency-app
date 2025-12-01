import React, { useState } from 'react';
import TagCategoryList from './TagCategoryList';

export default function TagEditor({ asset }) {
  const [manualTags, setManualTags] = useState<string[]>(asset.metadata?.manualTags || []);
  const [newTag, setNewTag] = useState('');

  const aiTags = asset.metadata?.aiTags || {};

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!manualTags.includes(newTag.trim())) {
        setManualTags([...manualTags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setManualTags(manualTags.filter(tag => tag !== tagToRemove));
  };

  const handleRetag = async () => {
    alert('AI re-tagging initiated...');
    // This would call the POST /creative-tagging/retag endpoint
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Asset Tags</h3>
        <button onClick={handleRetag} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Retag with AI</button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <TagCategoryList title="AI Keywords" tags={aiTags.keywords} />
        <TagCategoryList title="AI Tone" tags={aiTags.tone} />
        <TagCategoryList title="AI Aesthetic" tags={aiTags.aesthetic} />

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Manual Tags</h4>
          <div className="flex flex-wrap gap-1">
            {manualTags.map(tag => (
              <div key={tag} className="flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                <span>{tag}</span>
                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-green-600 hover:text-green-900">&times;</button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add a tag..."
            className="w-full mt-2 p-1 text-sm border-b bg-transparent focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}