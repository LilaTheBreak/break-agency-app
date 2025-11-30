export default function ContractReviewCard({ contract }) {
  if (!contract) return null;
  return (
    <div className="rounded-2xl border p-4">
      <h3 className="mb-2 text-lg font-semibold">Contract Analysis</h3>

      <h4 className="mt-4 text-sm font-bold">Summary</h4>
      <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(contract.aiSummary, null, 2)}
      </pre>

      <h4 className="mt-4 text-sm font-bold">Risks</h4>
      <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(contract.aiRisks, null, 2)}
      </pre>

      <h4 className="mt-4 text-sm font-bold">Redlines</h4>
      <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(contract.aiRedlines, null, 2)}
      </pre>

      <h4 className="mt-4 text-sm font-bold">Mapped Deal Terms</h4>
      <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(contract.aiDealMapping, null, 2)}
      </pre>
    </div>
  );
}
