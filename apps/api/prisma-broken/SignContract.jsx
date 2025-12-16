import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you use react-router
import SignatureCanvas from '../components/Signature/SignatureCanvas';

export default function SignContractPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [signerEmail, setSignerEmail] = useState(null);

  useEffect(() => {
    fetch(`/api/signature/${token}`)
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setRequest(data.request);
        setSignerEmail(data.signerEmail);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmitSignature = async (signatureImageBase64) => {
    await fetch(`/api/signature/${request.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerEmail, signatureImageBase64 }),
    });
    alert('Thank you! Your signature has been submitted.');
    // Redirect to a confirmation page
  };

  if (loading) return <div>Verifying signing link...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Sign Your Contract</h1>
        <p className="text-sm text-gray-500 mb-6">You are signing as {signerEmail}.</p>

        <div className="h-96 border rounded-md mb-6 overflow-y-scroll">
          {/* In a real app, you would render the PDF here using a library like react-pdf */}
          <p className="p-4 text-xs">PDF contract content would be displayed here...</p>
        </div>

        <h2 className="font-semibold mb-2">Please sign below:</h2>
        <SignatureCanvas onEnd={handleSubmitSignature} />

        <button onClick={() => { /* This would trigger onEnd on the canvas ref */ }} className="w-full mt-4 px-4 py-3 font-semibold text-white bg-blue-600 rounded-md">
          I Agree - Submit Signature
        </button>
      </div>
    </div>
  );
}