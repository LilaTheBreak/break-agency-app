/**
 * Health Score Snapshot Service
 * 
 * Handles:
 * - Creating health score snapshots
 * - Detecting score drops and threshold crossings
 * - Triggering auto-task creation
 * - Calculating trends
 */

import prisma from '../lib/prisma.js';

const HEALTH_SCORE_CONFIG = {
  // Threshold percentages for warnings
  CRITICAL_THRESHOLD: 50, // Score < 50 = critical
  WARNING_THRESHOLD: 70,  // Score < 70 = warning
  
  // Drop detection
  SCORE_DROP_THRESHOLD: 10, // Trigger if score drops 10+ points
  
  // Anti-spam safeguards
  COOLDOWN_DAYS: 7,       // Don't re-trigger within 7 days
  
  // Snapshot timing
  SNAPSHOT_INTERVAL_HOURS: 24, // Max one snapshot per day per talent (unless score changes)
};

/**
 * Calculate and save health score snapshot
 * Detects significant drops and triggers auto-tasks
 */
export async function captureHealthScoreSnapshot(talentId, score, issueData = {}) {
  if (!talentId || typeof score !== 'number' || score < 0 || score > 100) {
    throw new Error('Invalid talentId or score');
  }

  // Get previous snapshot for delta detection
  const previousSnapshot = await prisma.healthScoreSnapshot.findFirst({
    where: { talentId },
    orderBy: { calculatedAt: 'desc' },
  });

  const previousScore = previousSnapshot?.score || 100;
  const scoreDelta = previousScore - score;
  
  console.log(`[HEALTH SNAPSHOT] Talent ${talentId}: ${previousScore}% → ${score}% (delta: ${scoreDelta})`);

  // Extract issue triggers from issue data
  const triggers = extractTriggers(issueData);
  
  // Create snapshot
  const snapshot = await prisma.healthScoreSnapshot.create({
    data: {
      talentId,
      score,
      previousScore,
      factors: issueData ? issueData.factors || {} : {},
      triggers,
      metadata: issueData ? {
        issueCount: 0,
        criticalIssues: 0,
        highIssues: 0,
      } : {}
    }
  });

  console.log(`[HEALTH SNAPSHOT] Created snapshot ${snapshot.id} for talent ${talentId}`);

  // Check if we should trigger auto-task
  const shouldTriggerTask = shouldCreateAutoTask(score, previousScore, previousSnapshot);
  
  if (shouldTriggerTask) {
    console.log(`[HEALTH AUTO-TASK] Triggering for talent ${talentId} (score: ${score})`);
    try {
      const task = await createAutoHealthTask(talentId, score, triggers, issueData);
      
      // Update snapshot with task reference
      await prisma.healthScoreSnapshot.update({
        where: { id: snapshot.id },
        data: {
          autoTaskCreated: true,
          autoTaskId: task.id
        }
      });
      
      console.log(`[HEALTH AUTO-TASK] Created task ${task.id} for talent ${talentId}`);
    } catch (err) {
      console.error(`[HEALTH AUTO-TASK ERROR] Failed to create task for talent ${talentId}:`, err);
      // Don't fail the snapshot if task creation fails
    }
  }

  return snapshot;
}

/**
 * Determine if we should create an auto-task
 */
function shouldCreateAutoTask(currentScore, previousScore, lastSnapshot) {
  // Never trigger on first check (no previous score)
  if (!lastSnapshot) {
    console.log('[HEALTH AUTO-TASK CHECK] First snapshot - no trigger');
    return false;
  }

  const scoreDelta = previousScore - currentScore;
  const talentId = lastSnapshot.talentId;

  // Check 1: Did score drop by ≥10 points?
  if (scoreDelta >= HEALTH_SCORE_CONFIG.SCORE_DROP_THRESHOLD) {
    console.log(`[HEALTH AUTO-TASK CHECK] Score dropped ${scoreDelta} points - trigger`);
    return true;
  }

  // Check 2: Did score cross critical threshold?
  if (currentScore < HEALTH_SCORE_CONFIG.CRITICAL_THRESHOLD && 
      previousScore >= HEALTH_SCORE_CONFIG.CRITICAL_THRESHOLD) {
    console.log('[HEALTH AUTO-TASK CHECK] Crossed critical threshold - trigger');
    return true;
  }

  // Check 3: Did score cross warning threshold (and not critical)?
  if (currentScore < HEALTH_SCORE_CONFIG.WARNING_THRESHOLD && 
      previousScore >= HEALTH_SCORE_CONFIG.WARNING_THRESHOLD &&
      currentScore >= HEALTH_SCORE_CONFIG.CRITICAL_THRESHOLD) {
    console.log('[HEALTH AUTO-TASK CHECK] Crossed warning threshold - trigger');
    return true;
  }

  console.log('[HEALTH AUTO-TASK CHECK] No trigger conditions met');
  return false;
}

/**
 * Create auto-task for health score drop
 */
async function createAutoHealthTask(talentId, score, triggers, issueData) {
  // Check for existing open health task (anti-spam)
  const existingTask = await prisma.creatorTask.findFirst({
    where: {
      creatorId: talentId,
      status: { not: 'COMPLETED' }
    },
    orderBy: { createdAt: 'desc' }
  });

  // If recent task exists, check cooldown
  if (existingTask) {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(existingTask.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated < HEALTH_SCORE_CONFIG.COOLDOWN_DAYS) {
      console.log(`[HEALTH AUTO-TASK BLOCKED] Cooldown active (${daysSinceCreated}/${HEALTH_SCORE_CONFIG.COOLDOWN_DAYS} days)`);
      throw new Error('Auto-task cooldown active - recent health task already exists');
    }
  }

  // Build task description from triggers
  const description = buildTaskDescription(score, triggers, issueData);

  // Determine priority
  const priority = score < HEALTH_SCORE_CONFIG.CRITICAL_THRESHOLD 
    ? 'high' 
    : 'medium';

  // Create the task
  const task = await prisma.creatorTask.create({
    data: {
      id: `task_${Date.now()}`,
      creatorId: talentId,
      title: `Health score dropped to ${score}%`,
      description,
      priority,
      status: 'pending',
      taskType: 'health_check',
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 days
    }
  });

  return task;
}

/**
 * Build task description from health issues
 */
function buildTaskDescription(score, triggers, issueData) {
  let description = `Review and address health score issues.\n\n`;
  description += `Current Score: ${score}%\n`;
  description += `Priority Level: ${score < 50 ? 'CRITICAL' : score < 70 ? 'WARNING' : 'ATTENTION'}\n\n`;

  if (triggers.length > 0) {
    description += `Main Issues:\n`;
    triggers.forEach(trigger => {
      const label = triggerToLabel(trigger);
      description += `• ${label}\n`;
    });
  }

  if (issueData.issues && issueData.issues.length > 0) {
    description += `\nTop Actions:\n`;
    issueData.issues.slice(0, 3).forEach(issue => {
      description += `• ${issue.actionTitle}: ${issue.title}\n`;
    });
  }

  return description;
}

/**
 * Convert trigger codes to human-readable labels
 */
function triggerToLabel(trigger) {
  const labels = {
    'overdue_tasks': 'Overdue tasks pending',
    'incomplete_profile': 'Missing profile information',
    'inactive_deals': 'No active deals or stale opportunities',
    'missing_socials': 'Social profiles not connected',
    'unreviewed_briefs': 'Briefs awaiting approval',
    'inactivity': 'Profile has been inactive'
  };
  return labels[trigger] || trigger;
}

/**
 * Extract trigger codes from issue data
 */
function extractTriggers(issueData) {
  if (!issueData.issues) return [];
  
  const triggerMap = {
    'overdue_tasks': false,
    'incomplete_profile': false,
    'inactive_deals': false,
    'missing_socials': false,
    'unreviewed_briefs': false,
    'inactivity': false
  };

  issueData.issues.forEach(issue => {
    if (triggerMap.hasOwnProperty(issue.id)) {
      triggerMap[issue.id] = true;
    }
  });

  return Object.keys(triggerMap).filter(key => triggerMap[key]);
}

/**
 * Get health score trend (last 7 and 30 days)
 */
export async function getHealthScoreTrend(talentId, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshots = await prisma.healthScoreSnapshot.findMany({
    where: {
      talentId,
      calculatedAt: { gte: cutoffDate }
    },
    orderBy: { calculatedAt: 'asc' },
    select: {
      score: true,
      calculatedAt: true,
      triggers: true
    }
  });

  if (snapshots.length === 0) {
    return null;
  }

  // Calculate trend metrics
  const currentScore = snapshots[snapshots.length - 1].score;
  const startingScore = snapshots[0].score;
  const scores = snapshots.map(s => s.score);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const trend = {
    current: currentScore,
    starting: startingScore,
    average: averageScore,
    change: currentScore - startingScore,
    direction: currentScore > startingScore ? 'improving' : currentScore < startingScore ? 'declining' : 'stable',
    percentChange: startingScore > 0 ? Math.round(((currentScore - startingScore) / startingScore) * 100) : 0,
    snapshots: snapshots.map(s => ({
      score: s.score,
      date: s.calculatedAt,
      triggers: s.triggers
    }))
  };

  return trend;
}

/**
 * Get last score for a talent (for UI display)
 */
export async function getLastHealthSnapshot(talentId) {
  return prisma.healthScoreSnapshot.findFirst({
    where: { talentId },
    orderBy: { calculatedAt: 'desc' },
    select: {
      score: true,
      calculatedAt: true,
      triggers: true,
      metadata: true
    }
  });
}

/**
 * Close auto-task when score improves above threshold
 */
export async function resolveHealthTaskIfScoreImproved(talentId, newScore) {
  // If score is now healthy, close any open auto-task
  if (newScore >= HEALTH_SCORE_CONFIG.WARNING_THRESHOLD) {
    const autoTask = await prisma.creatorTask.findFirst({
      where: {
        creatorId: talentId,
        status: 'OPEN'
      }
    });

    if (autoTask) {
      await prisma.creatorTask.update({
        where: { id: autoTask.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      console.log(`[HEALTH AUTO-TASK RESOLVED] Task ${autoTask.id} auto-closed - score improved to ${newScore}%`);
    }
  }
}
