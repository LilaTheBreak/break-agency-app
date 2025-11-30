/**
 * Predefined templates for different deliverable types.
 * Durations are in working days.
 */
export const TIMELINE_TEMPLATES = {
  YT_VIDEO: [
    { step: 'Pre-production & Scripting', duration: 3 },
    { step: 'Shooting Day', duration: 1 },
    { step: 'First Edit', duration: 4 },
    { step: 'Client Review Round 1', duration: 2 },
    { step: 'Final Edits', duration: 2 },
    { step: 'Final Approval', duration: 1 },
  ],
  IG_POST: [
    { step: 'Concept & Moodboard', duration: 1 },
    { step: 'Shooting', duration: 1 },
    { step: 'Editing & Graphics', duration: 1 },
    { step: 'Client Review', duration: 1 },
  ],
  default: [
    { step: 'Planning', duration: 2 },
    { step: 'Execution', duration: 3 },
    { step: 'Review', duration: 2 },
  ],
};

export function getTemplateForType(type: string = 'default') {
  return TIMELINE_TEMPLATES[type.toUpperCase() as keyof typeof TIMELINE_TEMPLATES] || TIMELINE_TEMPLATES.default;
}