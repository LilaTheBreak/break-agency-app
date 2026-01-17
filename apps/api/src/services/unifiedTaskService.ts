import prisma from '../lib/prisma.js';
import { logError, logInfo } from '../lib/logger.js';

/**
 * Unified Task Service
 * 
 * Consolidates task queries across all task models:
 * - TalentTask (tasks linked to talent directly)
 * - CreatorTask (tasks linked to deals/deliverables)
 * - CrmTask (generic CRM tasks)
 * - OutreachTask (tasks linked to outreach)
 * 
 * Returns normalized task objects with consistent schema
 */

export interface UnifiedTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  dueAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  
  // Ownership
  createdBy?: string | null;
  owner?: string | null;
  
  // Relations
  talentId?: string | null;
  dealId?: string | null;
  linkedDealId?: string | null;
  meetingId?: string | null;
  outreachId?: string | null;
  
  // Metadata
  taskType: 'TALENT' | 'CREATOR' | 'CRM' | 'OUTREACH';
  sourceModel: string;
}

/**
 * Fetch all tasks across all models with optional filtering
 * 
 * Consolidates TalentTask, CreatorTask, CrmTask, and OutreachTask
 * into a single unified result set
 */
export async function getUnifiedTasks(filters?: {
  status?: string;
  priority?: string;
  talentId?: string;
  dealId?: string;
  outreachId?: string;
  userId?: string;
  userRole?: string;
  excludeCompleted?: boolean;
}): Promise<UnifiedTask[]> {
  try {
    const tasks: UnifiedTask[] = [];
    const excludeCompleted = filters?.excludeCompleted === true;

    // Fetch TalentTasks
    if (!excludeCompleted) {
      const talentTasks = await prisma.talentTask.findMany({
        where: {
          ...(filters?.talentId && { talentId: filters.talentId }),
        },
        orderBy: { dueDate: 'asc' },
      });

      const normalizedTalentTasks: UnifiedTask[] = talentTasks
        .filter(task => !filters?.status || task.status === filters.status)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.notes,
          status: task.status,
          priority: 'Medium', // TalentTask doesn't have priority, default to Medium
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          talentId: task.talentId,
          taskType: 'TALENT',
          sourceModel: 'TalentTask',
        }));

      tasks.push(...normalizedTalentTasks);
    }

    // Fetch CreatorTasks
    if (!excludeCompleted) {
      const creatorTasks = await prisma.creatorTask.findMany({
        where: {
          ...(filters?.talentId && { creatorId: filters.talentId }),
          ...(filters?.dealId && { linkedDealId: filters.dealId }),
          ...(filters?.priority && { priority: filters.priority }),
        },
        orderBy: { dueAt: 'asc' },
      });

      const normalizedCreatorTasks: UnifiedTask[] = creatorTasks
        .filter(task => !filters?.status || task.status === filters.status)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueAt,
          dueAt: task.dueAt,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          talentId: task.creatorId,
          dealId: task.linkedDealId,
          linkedDealId: task.linkedDealId,
          taskType: 'CREATOR',
          sourceModel: 'CreatorTask',
        }));

      tasks.push(...normalizedCreatorTasks);
    }

    // Fetch CrmTasks (with visibility filtering)
    if (!excludeCompleted) {
      const crmTasks = await prisma.crmTask.findMany({
        where: {
          ...(filters?.priority && { priority: filters.priority }),
        },
        orderBy: { dueDate: 'asc' },
      });

      const normalizedCrmTasks: UnifiedTask[] = crmTasks
        .filter(task => !filters?.status || task.status === filters.status)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          createdBy: task.createdBy,
          owner: task.ownerId,
          dealId: task.dealId,
          taskType: 'CRM',
          sourceModel: 'CrmTask',
        }));

      tasks.push(...normalizedCrmTasks);
    }

    // Fetch OutreachTasks
    if (!excludeCompleted) {
      const outreachTasks = await prisma.outreachTask.findMany({
        where: {
          ...(filters?.outreachId && { outreachId: filters.outreachId }),
          ...(filters?.priority && { priority: filters.priority }),
        },
        orderBy: { dueDate: 'asc' },
      });

      const normalizedOutreachTasks: UnifiedTask[] = outreachTasks
        .filter(task => !filters?.status || task.status === filters.status)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          owner: task.owner,
          outreachId: task.outreachId,
          taskType: 'OUTREACH',
          sourceModel: 'OutreachTask',
        }));

      tasks.push(...normalizedOutreachTasks);
    }

    // Sort all tasks by due date
    tasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return tasks;
  } catch (error) {
    logError('getUnifiedTasks', error);
    throw error;
  }
}

/**
 * Get tasks grouped by status
 */
export async function getTasksByStatus(status: string, filters?: any): Promise<UnifiedTask[]> {
  return getUnifiedTasks({ ...filters, status });
}

/**
 * Get tasks due today
 */
export async function getTasksDueToday(filters?: any): Promise<UnifiedTask[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await getUnifiedTasks(filters);

  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDay.getTime() === today.getTime();
  });
}

/**
 * Get tasks due tomorrow
 */
export async function getTasksDueTomorrow(filters?: any): Promise<UnifiedTask[]> {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const tasks = await getUnifiedTasks(filters);

  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDay.getTime() === tomorrow.getTime();
  });
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(filters?: any): Promise<UnifiedTask[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tasks = await getUnifiedTasks(filters);

  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDay.getTime() < today.getTime() && task.status !== 'COMPLETED' && task.status !== 'Completed';
  });
}

/**
 * Get tasks by talent ID (all task types linked to talent)
 */
export async function getTasksByTalentId(talentId: string): Promise<UnifiedTask[]> {
  return getUnifiedTasks({ talentId });
}

/**
 * Get tasks by deal ID (all task types linked to deal)
 */
export async function getTasksByDealId(dealId: string): Promise<UnifiedTask[]> {
  return getUnifiedTasks({ dealId });
}

/**
 * Get tasks by outreach ID
 */
export async function getTasksByOutreachId(outreachId: string): Promise<UnifiedTask[]> {
  return getUnifiedTasks({ outreachId });
}

/**
 * Count tasks by status across all models
 */
export async function countTasksByStatus(): Promise<Record<string, number>> {
  try {
    const counts = {
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    const [talentTaskCounts, creatorTaskCounts, crmTaskCounts, outreachTaskCounts] = await Promise.all([
      prisma.talentTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.creatorTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.crmTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.outreachTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Aggregate counts
    const allCounts = [talentTaskCounts, creatorTaskCounts, crmTaskCounts, outreachTaskCounts];

    for (const groupCounts of allCounts) {
      for (const group of groupCounts) {
        const status = (group.status as string).toLowerCase();
        counts[status as keyof typeof counts] = (counts[status as keyof typeof counts] || 0) + group._count.status;
      }
    }

    return counts;
  } catch (error) {
    logError('countTasksByStatus', error);
    throw error;
  }
}

export default {
  getUnifiedTasks,
  getTasksByStatus,
  getTasksDueToday,
  getTasksDueTomorrow,
  getOverdueTasks,
  getTasksByTalentId,
  getTasksByDealId,
  getTasksByOutreachId,
  countTasksByStatus,
};
