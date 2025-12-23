import prisma from "../lib/prisma.js";

/**
 * Create notifications for task mentions and assignments
 */
export async function createTaskNotifications(task: any, action: "created" | "updated" | "assigned" | "mentioned") {
  const notifications: Array<{
    userId: string;
    type: string;
    title: string;
    body: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: Date;
  }> = [];
  
  try {
    // Extract mentioned users from description
    const mentionedUserIds = (task.mentions || []).map((m: any) => m.userId);
    
    // Notify mentioned users
    for (const userId of mentionedUserIds) {
      if (userId && userId !== task.createdBy) {
        notifications.push({
          userId,
          type: "task_mention",
          title: "You were mentioned in a task",
          body: `${task.Owner?.name || task.CreatedByUser?.name || "Someone"} mentioned you in "${task.title}"`,
          entityId: task.id,
          isRead: false,
          createdAt: new Date()
        });
      }
    }
    
    // Notify assigned users
    for (const userId of (task.assignedUserIds || [])) {
      if (userId && userId !== task.createdBy && !mentionedUserIds.includes(userId)) {
        notifications.push({
          userId,
          type: "task_assignment",
          title: "You were assigned to a task",
          body: `${task.Owner?.name || task.CreatedByUser?.name || "Someone"} assigned you to "${task.title}"`,
          entityId: task.id,
          isRead: false,
          createdAt: new Date()
        });
      }
    }
    
    // Notify owner if different from creator
    if (task.ownerId && task.ownerId !== task.createdBy && action === "created") {
      notifications.push({
        userId: task.ownerId,
        type: "task_ownership",
        title: "You own a new task",
        body: `${task.CreatedByUser?.name || "Someone"} created a task for you: "${task.title}"`,
        entityId: task.id,
        isRead: false,
        createdAt: new Date()
      });
    }
    
    // Bulk create notifications
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications.map(n => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
          ...n
        }))
      });
      
      console.log(`Created ${notifications.length} notifications for task ${task.id}`);
    }
  } catch (error) {
    console.error("Error creating task notifications:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Check if user can view a task based on visibility rules
 */
export function canViewTask(task: any, userId: string, userRole: string): boolean {
  // Super Admins can see everything
  if (userRole === "SUPERADMIN") return true;
  
  // Admins can see everything
  if (userRole === "ADMIN") return true;
  
  // Task owner can see it
  if (task.ownerId === userId) return true;
  
  // Assigned users can see it
  if (task.assignedUserIds && task.assignedUserIds.includes(userId)) return true;
  
  // Mentioned users can see it
  if (task.mentions && Array.isArray(task.mentions)) {
    const isMentioned = task.mentions.some((m: any) => m.userId === userId);
    if (isMentioned) return true;
  }
  
  // Creator can see it
  if (task.createdBy === userId) return true;
  
  // Related users can see it
  if (task.relatedUsers && task.relatedUsers.includes(userId)) return true;
  
  return false;
}

/**
 * Build task visibility where clause for Prisma query
 */
export function buildTaskVisibilityWhere(userId: string, userRole: string) {
  // Super Admins and Admins see everything
  if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
    return {};
  }
  
  // Regular users: show tasks where they are owner, assigned, mentioned, creator, or related
  return {
    OR: [
      { ownerId: userId },
      { assignedUserIds: { has: userId } },
      { createdBy: userId },
      { relatedUsers: { has: userId } },
      // Note: Can't easily filter by mentions in Prisma (JSON field)
      // Will filter mentions in application layer
    ]
  };
}
