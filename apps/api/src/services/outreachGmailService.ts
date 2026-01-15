import prisma from '../lib/prisma.js';

export interface GmailThreadStatus {
  threadId: string;
  hasNewMessages: boolean;
  lastMessageTimestamp: number;
  messageCount: number;
  isReplied: boolean;
}

/**
 * Sync Gmail thread and update Outreach stage
 * In a real implementation, this would connect to Gmail API
 * For now, we simulate by checking lastContact timestamp
 */
export async function syncGmailThread(outreachId: string, gmailThreadId: string) {
  try {
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
      include: { OutreachEmailThread: true },
    });

    if (!outreach) {
      throw new Error(`Outreach record ${outreachId} not found`);
    }

    // Check if we have an existing email thread record
    let emailThread = outreach.OutreachEmailThread?.[0];

    if (!emailThread) {
      // Create new email thread record
      emailThread = await prisma.outreachEmailThread.create({
        data: {
          outreachId,
          gmailThreadId,
          lastMessageAt: new Date(),
          status: 'awaiting_reply',
        },
      });
    }

    // Simulate checking Gmail API (in real implementation, use gmail.users.threads.get)
    // For now, we just mark as synced
    await prisma.outreachEmailThread.update({
      where: { id: emailThread.id },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    return emailThread;
  } catch (error) {
    console.error('Error syncing Gmail thread:', error);
    throw error;
  }
}

/**
 * Detect if an outreach has been replied to
 * In real implementation, this checks Gmail API message content
 */
export async function detectReply(outreachId: string): Promise<boolean> {
  try {
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
    });

    if (!outreach) return false;

    // Check if emailsReplies > 0
    return outreach.emailsReplies > 0;
  } catch (error) {
    console.error('Error detecting reply:', error);
    return false;
  }
}

/**
 * Update outreach stage based on Gmail activity
 * Stages: not_started -> awaiting_reply -> replied -> meeting_scheduled -> closed
 */
export async function updateStageBasedOnGmail(outreachId: string) {
  try {
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
      include: { OutreachEmailThread: true },
    });

    if (!outreach) {
      throw new Error(`Outreach record ${outreachId} not found`);
    }

    const hasReplies = outreach.emailsReplies > 0;
    const emailThread = outreach.OutreachEmailThread?.[0];

    let newStage = outreach.stage;
    let newStatus = outreach.status;

    // Determine new stage based on activity
    if (outreach.stage === 'not_started' && outreach.emailsSent > 0) {
      newStage = 'awaiting_reply';
      newStatus = 'Email sent - awaiting response';
    } else if (outreach.stage === 'awaiting_reply' && hasReplies) {
      newStage = 'replied';
      newStatus = 'Reply received';
    } else if (outreach.stage === 'replied') {
      // Check if next step should be scheduled meeting or closed
      const hasNotes = await prisma.outreachNote.count({
        where: { outreachId },
      });

      if (hasNotes > 0) {
        newStage = 'qualified';
        newStatus = 'Qualified for meeting';
      }
    }

    // Update if stage changed
    if (newStage !== outreach.stage) {
      await prisma.outreach.update({
        where: { id: outreachId },
        data: {
          stage: newStage,
          status: newStatus,
          updatedAt: new Date(),
        },
      });
    }

    return { previousStage: outreach.stage, newStage, stageChanged: newStage !== outreach.stage };
  } catch (error) {
    console.error('Error updating stage based on Gmail:', error);
    throw error;
  }
}

/**
 * Mark a Gmail thread as having a new reply
 */
export async function markAsReplied(outreachId: string, emailCount: number = 1) {
  try {
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
    });

    if (!outreach) {
      throw new Error(`Outreach record ${outreachId} not found`);
    }

    // Update email reply count and last contact date
    const updated = await prisma.outreach.update({
      where: { id: outreachId },
      data: {
        emailsReplies: outreach.emailsReplies + emailCount,
        lastContact: new Date(),
        updatedAt: new Date(),
      },
    });

    // Trigger stage update based on new Gmail state
    await updateStageBasedOnGmail(outreachId);

    return updated;
  } catch (error) {
    console.error('Error marking as replied:', error);
    throw error;
  }
}

/**
 * Schedule next follow-up based on current stage and activity
 * Returns the scheduled follow-up date
 */
export async function scheduleFollowUp(outreachId: string, daysFromNow: number = 3): Promise<Date> {
  try {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysFromNow);

    await prisma.outreach.update({
      where: { id: outreachId },
      data: {
        nextFollowUp: followUpDate,
        updatedAt: new Date(),
      },
    });

    return followUpDate;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    throw error;
  }
}

/**
 * Get all overdue follow-ups (for batch processing)
 */
export async function getOverdueFollowUps() {
  try {
    const now = new Date();
    return await prisma.outreach.findMany({
      where: {
        nextFollowUp: {
          lt: now,
        },
        archived: false,
        stage: {
          not: 'closed',
        },
      },
      orderBy: {
        nextFollowUp: 'asc',
      },
      take: 50, // Batch process 50 at a time
    });
  } catch (error) {
    console.error('Error fetching overdue follow-ups:', error);
    throw error;
  }
}

/**
 * Auto-sync function that would be called by a cron job or webhook
 * Processes all pending outreach and updates stages based on email activity
 */
export async function autoSyncAllOutreach() {
  try {
    const outreachList = await prisma.outreach.findMany({
      where: { archived: false },
      include: { OutreachEmailThread: true },
    });

    const results = [];
    for (const outreach of outreachList) {
      try {
        const stageUpdate = await updateStageBasedOnGmail(outreach.id);
        results.push(stageUpdate);
      } catch (error) {
        console.error(`Failed to update outreach ${outreach.id}:`, error);
      }
    }

    return {
      processed: results.length,
      stageChanges: results.filter((r) => r.stageChanged).length,
    };
  } catch (error) {
    console.error('Error in auto-sync:', error);
    throw error;
  }
}
