import React from 'react';

const Frame = ({ frame }) => (
  <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
    <img src={frame.imageUrl} alt={`Frame ${frame.frameNumber}`} className="w-full h-40 object-cover" />
    <div className="p-3">
      <p className="text-xs font-bold">Frame {frame.frameNumber}</p>
      <p className="text-sm mt-1">{frame.description}</p>
    </div>
  </div>
);

export default function FrameGallery({ frames }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {frames.map(frame => (
        <Frame key={frame.id} frame={frame} />
      ))}
    </div>
  );
}