export default function DealPipelineBadge({ stage }) {
  const color =
    {
      NEW_LEAD: "bg-gray-500",
      BRIEF_RECEIVED: "bg-blue-500",
      NEGOTIATING: "bg-purple-500",
      PENDING_CONTRACT: "bg-orange-500",
      CONTRACT_SENT: "bg-yellow-500",
      LIVE: "bg-green-600",
      CONTENT_SUBMITTED: "bg-teal-600",
      APPROVED: "bg-indigo-600",
      PAYMENT_SENT: "bg-rose-600",
      CLOSED_WON: "bg-emerald-700",
      CLOSED_LOST: "bg-red-700"
    }[stage] || "bg-gray-400";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${color}`}>
      {(stage || "UNKNOWN").replace(/_/g, " ")}
    </span>
  );
}
