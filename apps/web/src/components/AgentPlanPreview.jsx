export default function AgentPlanPreview({ plan }) {
  if (!plan) return null;

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">AI Agent Plan</h3>
      <pre className="text-xs bg-gray-100 p-3 rounded whitespace-pre-wrap">
        {JSON.stringify(plan, null, 2)}
      </pre>
    </div>
  );
}
