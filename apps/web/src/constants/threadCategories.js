export const CATEGORY_STYLES = {
  Deal: { label: "Deal Opportunity", color: "bg-green-600 text-white" },
  Event: { label: "Event Invite", color: "bg-blue-600 text-white" },
  Gifting: { label: "Gifting Offer", color: "bg-purple-600 text-white" },
  PR: { label: "PR / Press", color: "bg-orange-600 text-white" },
  Scam: { label: "Potential Scam", color: "bg-red-700 text-white" },
  Spam: { label: "Spam", color: "bg-neutral-600 text-white" },
  Other: { label: "General", color: "bg-neutral-400 text-black" }
};

export const CATEGORY_WEIGHT = {
  Deal: 100,
  Event: 90,
  PR: 80,
  Gifting: 70,
  Other: 50,
  Spam: 20,
  Scam: 10
};
