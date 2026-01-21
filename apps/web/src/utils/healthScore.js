/**
 * Health Score System
 * 
 * Calculates talent profile health based on multiple weighted factors
 * and returns actionable issues affecting the score
 */

// Factor weights (total = 100)
const HEALTH_FACTORS = {
  overdueTasks: { weight: 25, label: "Tasks & Deadlines" },
  incompleteProfile: { weight: 15, label: "Profile Completeness" },
  inactiveDeals: { weight: 20, label: "Commercial Activity" },
  missingSocials: { weight: 10, label: "Social Connections" },
  unreviewedBriefs: { weight: 20, label: "Briefs & Approvals" },
  inactivity: { weight: 10, label: "Recent Activity" }
};

/**
 * Calculate overall health score and detect issues
 * @param {Object} talent - Talent object with tasks, deals, socials, etc.
 * @returns {Object} { score: number, issues: Array, summary: string }
 */
export function calculateHealthScore(talent) {
  if (!talent) {
    return { score: 0, issues: [], summary: "No data" };
  }

  let score = 100;
  const issues = [];

  // 1. CHECK OVERDUE TASKS (weight: 25)
  const overdueTasks = detectOverdueTasks(talent);
  if (overdueTasks.count > 0) {
    const impact = Math.min(overdueTasks.count * 5, 25); // Cap at 25
    score -= impact;
    issues.push({
      id: "overdue_tasks",
      category: "Tasks & Deadlines",
      title: `${overdueTasks.count} overdue task${overdueTasks.count > 1 ? 's' : ''}`,
      description: `${overdueTasks.count} task${overdueTasks.count > 1 ? 's' : ''} past due. Complete these to improve profile health.`,
      impact: -impact,
      severity: overdueTasks.count > 3 ? "critical" : overdueTasks.count > 1 ? "high" : "medium",
      actionTitle: "View Tasks",
      actionType: "view_tasks",
      actionData: { tasks: overdueTasks.items }
    });
  }

  // 2. CHECK INCOMPLETE PROFILE (weight: 15)
  const profileGaps = detectProfileGaps(talent);
  if (profileGaps.missing.length > 0) {
    const impact = Math.min(profileGaps.missing.length * 3, 15); // Cap at 15
    score -= impact;
    issues.push({
      id: "incomplete_profile",
      category: "Profile Completeness",
      title: `${profileGaps.missing.length} missing profile field${profileGaps.missing.length > 1 ? 's' : ''}`,
      description: `Complete these fields: ${profileGaps.missing.join(', ')}`,
      impact: -impact,
      severity: profileGaps.missing.length > 3 ? "high" : "medium",
      actionTitle: "Complete Profile",
      actionType: "complete_profile",
      actionData: { fields: profileGaps.missing }
    });
  }

  // 3. CHECK INACTIVE DEALS (weight: 20)
  const staleDealIssue = detectStaleDealIssue(talent);
  if (staleDealIssue) {
    score -= 20;
    issues.push({
      id: "inactive_deals",
      category: "Commercial Activity",
      title: "No active deals or stale opportunities",
      description: staleDealIssue.description,
      impact: -20,
      severity: "high",
      actionTitle: "Create Deal",
      actionType: "create_deal",
      actionData: {}
    });
  }

  // 4. CHECK MISSING SOCIAL CONNECTIONS (weight: 10)
  const missingSocials = detectMissingSocials(talent);
  if (missingSocials.length > 0) {
    const impact = missingSocials.length * 5;
    score -= impact;
    issues.push({
      id: "missing_socials",
      category: "Social Connections",
      title: `${missingSocials.length} social platform${missingSocials.length > 1 ? 's' : ''} not connected`,
      description: `Connect: ${missingSocials.join(', ')} to improve visibility and engagement metrics.`,
      impact: -impact,
      severity: "medium",
      actionTitle: "Add Social",
      actionType: "add_social",
      actionData: { platforms: missingSocials }
    });
  }

  // 5. CHECK UNREVIEWED BRIEFS (weight: 20)
  const unreviewedBriefsCount = detectUnreviewedBriefs(talent);
  if (unreviewedBriefsCount > 0) {
    const impact = Math.min(unreviewedBriefsCount * 5, 20); // Cap at 20
    score -= impact;
    issues.push({
      id: "unreviewed_briefs",
      category: "Briefs & Approvals",
      title: `${unreviewedBriefsCount} brief${unreviewedBriefsCount > 1 ? 's' : ''} awaiting review`,
      description: `Review and approve ${unreviewedBriefsCount} pending brief${unreviewedBriefsCount > 1 ? 's' : ''} to move deals forward.`,
      impact: -impact,
      severity: unreviewedBriefsCount > 2 ? "high" : "medium",
      actionTitle: "Review Briefs",
      actionType: "review_briefs",
      actionData: { count: unreviewedBriefsCount }
    });
  }

  // 6. CHECK INACTIVITY (weight: 10)
  const inactivityIssue = detectInactivity(talent);
  if (inactivityIssue) {
    score -= 10;
    issues.push({
      id: "inactivity",
      category: "Recent Activity",
      title: "Profile has been inactive",
      description: inactivityIssue.description,
      impact: -10,
      severity: "medium",
      actionTitle: "Reach Out",
      actionType: "create_task",
      actionData: { 
        taskTemplate: "Follow up on activity",
        daysOverdue: inactivityIssue.daysSinceActive
      }
    });
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Sort issues by severity and impact
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.impact - b.impact; // More negative = higher impact
  });

  return {
    score: Math.round(score),
    issues,
    summary: generateSummary(score, issues)
  };
}

/**
 * Detect overdue tasks
 */
function detectOverdueTasks(talent) {
  const tasks = talent.tasks || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdue = tasks.filter(task => {
    if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  });

  return {
    count: overdue.length,
    items: overdue.slice(0, 5) // Return first 5 for display
  };
}

/**
 * Detect incomplete profile fields
 */
function detectProfileGaps(talent) {
  const required = [
    { field: 'bio', label: 'Bio' },
    { field: 'location', label: 'Location' },
    { field: 'timezone', label: 'Timezone' }
  ];

  const missing = [];
  for (const req of required) {
    const value = talent[req.field];
    if (!value || value.trim() === '') {
      missing.push(req.label);
    }
  }

  return { missing };
}

/**
 * Detect stale or missing deals
 */
function detectStaleDealIssue(talent) {
  const deals = talent.deals || [];
  
  // No deals at all
  if (deals.length === 0) {
    return {
      description: "No deals are currently being tracked. Create one to track commercial opportunities."
    };
  }

  // Check if all deals are in terminal states
  const activeDeals = deals.filter(d => !['COMPLETED', 'LOST', 'DECLINED'].includes(d.status));
  
  if (activeDeals.length === 0) {
    return {
      description: "All deals are completed or declined. Create a new deal to track upcoming opportunities."
    };
  }

  // Check if most recent deal is stale (no update in 30+ days)
  const mostRecent = deals[0];
  if (mostRecent.updatedAt) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(mostRecent.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 30) {
      return {
        description: `Latest deal hasn't been updated in ${daysSinceUpdate} days. Update or create new deals to stay current.`
      };
    }
  }

  return null;
}

/**
 * Detect missing social connections
 */
function detectMissingSocials(talent) {
  const socials = talent.socials || [];
  const socialMap = {};
  socials.forEach(s => {
    socialMap[s.platform?.toUpperCase()] = true;
  });

  const expectedPlatforms = ['INSTAGRAM', 'TIKTOK'];
  const missing = [];

  for (const platform of expectedPlatforms) {
    if (!socialMap[platform]) {
      missing.push(platform.charAt(0) + platform.slice(1).toLowerCase());
    }
  }

  return missing;
}

/**
 * Detect unreviewed briefs
 */
function detectUnreviewedBriefs(talent) {
  // This would check for briefs awaiting approval
  // Implementation depends on your brief schema
  // For now, return 0
  return 0;
}

/**
 * Detect if profile is inactive
 */
function detectInactivity(talent) {
  const lastActive = talent.lastActiveAt || talent.updatedAt;
  if (!lastActive) return null;

  const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceActive > 90) {
    return {
      description: `No activity for ${daysSinceActive} days. Reach out to stay connected.`,
      daysSinceActive
    };
  }

  return null;
}

/**
 * Generate human-readable summary
 */
function generateSummary(score, issues) {
  if (score >= 90) {
    return "✅ This profile is in great health";
  }
  if (score >= 70) {
    return `⚠️ ${issues.length} area${issues.length !== 1 ? 's' : ''} to improve`;
  }
  if (score >= 50) {
    return `⚠️ Several issues need attention (${issues.length})`;
  }
  return `🔴 Profile needs immediate attention (${issues.length} issues)`;
}

/**
 * Get color for score
 */
export function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // green
  if (score >= 70) return '#f59e0b'; // amber
  if (score >= 50) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get category color
 */
export function getCategoryColor(category) {
  const colors = {
    'Tasks & Deadlines': '#ef4444',
    'Profile Completeness': '#f59e0b',
    'Commercial Activity': '#8b5cf6',
    'Social Connections': '#3b82f6',
    'Briefs & Approvals': '#ec4899',
    'Recent Activity': '#06b6d4'
  };
  return colors[category] || '#6b7280';
}
