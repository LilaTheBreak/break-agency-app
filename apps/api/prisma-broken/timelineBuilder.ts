/**
 * Generates a structured timeline for a set of deliverables.
 * @param deliverables - The list of deliverables for the campaign.
 * @returns A structured timeline object with calculated dates.
 */
export function buildTimeline(deliverables: any[]) {
  console.log(`[TIMELINE BUILDER] Building timeline for ${deliverables.length} deliverables.`);
  const timeline: any[] = [];
  let currentDate = new Date();

  for (const deliverable of deliverables) {
    const draftDueDate = new Date(currentDate.getTime() + 7 * 24 * 3600 * 1000); // 7 days for draft
    const approvalWindowEnd = new Date(draftDueDate.getTime() + 3 * 24 * 3600 * 1000); // 3 days for approval
    const postDate = new Date(approvalWindowEnd.getTime() + 4 * 24 * 3600 * 1000); // 4 days later for posting

    timeline.push({
      deliverableId: deliverable.id,
      title: `Draft for: ${deliverable.type}`,
      startDate: currentDate,
      endDate: draftDueDate,
      type: 'draft',
    });

    // Set the start date for the next deliverable
    currentDate = postDate;
  }

  return { summary: `Generated a timeline spanning ${timeline.length} key phases.`, timeline };
}