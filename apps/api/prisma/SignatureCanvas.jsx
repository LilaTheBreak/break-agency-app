import React, { useRef } from 'react';
import SignaturePad from 'react-signature-canvas';

export default function SignatureCanvas({ onEnd }) {
  const sigPad = useRef(null);

  const handleClear = () => {
    sigPad.current.clear();
  };

  const handleEnd = () => {
    if (sigPad.current.isEmpty()) {
      alert('Please provide a signature.');
    } else {
      onEnd(sigPad.current.toDataURL());
    }
  };

  return (
    <div>
      <SignaturePad
        ref={sigPad}
        canvasProps={{ className: 'w-full h-48 border rounded-md bg-gray-50 dark:bg-gray-700' }}
      />
      <div className="mt-2 flex gap-2">
        <button onClick={handleClear} className="text-xs">Clear</button>
      </div>
    </div>
  );
}