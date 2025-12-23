export default function ContractPreview({ contract }) {
  if (!contract) return null;

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <h3 className="font-semibold mb-2">Contract Draft</h3>

      {contract.pdfUrl ? (
        <iframe src={contract.pdfUrl} className="w-full h-[600px] rounded" />
      ) : (
        <p className="text-sm text-gray-500">PDF not generated yet.</p>
      )}

      <button className="mt-4 rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90">
        Approve &amp; Send
      </button>
    </div>
  );
}
