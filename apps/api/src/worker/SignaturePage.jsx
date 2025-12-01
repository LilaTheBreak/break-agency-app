import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePage() {
  const { signatureId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sigCanvas = useRef({});

  useEffect(() => {
    fetch(`/api/signature/${signatureId}`)
      .then(res => res.ok ? res.json() : Promise.reject('Request not found'))
      .then(setRequest)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [signatureId]);

  const clearCanvas = () => {
    sigCanvas.current.clear();
  };

  const handleSign = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Please provide your signature.');
      return;
    }

    const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    setLoading(true);

    try {
      const res = await fetch(`/api/signature/${signatureId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) throw new Error('Failed to submit signature.');
      alert('Document signed successfully!');
      // Redirect to a success page
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Signature Request...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!request) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign Contract: {request.contract.title}</h1>
      <p className="mb-4">You are signing as <span className="font-semibold">{request.signerName}</span> ({request.signerEmail}).</p>

      <div className="w-full h-96 bg-gray-200 mb-4">
        {/* PDF Previewer would go here, e.g., using react-pdf */}
        <p className="p-4">PDF document preview placeholder.</p>
      </div>

      <div className="border bg-white rounded-lg">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'w-full h-48' }}
        />
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={clearCanvas} className="px-4 py-2 font-semibold bg-gray-200 rounded-md">Clear</button>
        <button onClick={handleSign} className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md">I Agree & Sign</button>
      </div>
    </div>
  );
}