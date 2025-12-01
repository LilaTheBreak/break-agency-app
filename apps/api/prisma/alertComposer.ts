/**
 * Composes a user-friendly alert from raw detection data.
 * @param detection The raw data from a detector service.
 * @returns A structured alert object with a title, description, and action plan.
 */
export const composeAlert = (detection: any) => {
  let title = 'New Algorithm Alert';
  let description = detection.details;
  let actionPlan = [{ step: 1, instruction: 'Monitor your next post closely.' }];

  switch (detection.trendType || detection.changeType || detection.banType) {
    case 'trending_audio':
      title = '🔥 Trending Audio Detected';
      actionPlan = [
        { step: 1, instruction: 'Create a short video using this sound within the next 48 hours.' },
        { step: 2, instruction: 'Pair the audio with a relevant visual from your niche.' },
      ];
      break;
    case 'REACH_DECAY':
      title = '📉 Platform Reach Decay Detected';
      actionPlan = [
        { step: 1, instruction: 'Focus on high-retention formats like short, engaging videos.' },
        { step: 2, instruction: 'Test alternative content formats like carousels or stories.' },
      ];
      break;
    case 'HASHTAG_SUPPRESSION':
      title = '⚠️ Potential Visibility Limitation';
      actionPlan = [{ step: 1, instruction: 'Avoid using banned or flagged hashtags.' }, { step: 2, instruction: 'Focus on engaging with your existing community for the next 3-5 days.' }];
      break;
  }

  return { title, description, actionPlan, impact: detection.impact };
};