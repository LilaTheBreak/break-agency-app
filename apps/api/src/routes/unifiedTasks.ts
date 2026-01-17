import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import { getUnifiedTasks, getTasksDueToday, getTasksDueTomorrow, getOverdueTasks, getTasksByTalentId } from '../services/unifiedTaskService.js';
import { logError, logInfo } from '../lib/logger.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/tasks/unified
 * Get all tasks across all models (TalentTask, CreatorTask, CrmTask, OutreachTask)
 * 
 * Query parameters:
 * - status: Filter by task status
 * - priority: Filter by priority
 * - talentId: Filter by talent ID
 * - dealId: Filter by deal ID
 * - excludeCompleted: Exclude completed tasks (default: false)
 */
router.get("/unified", async (req: Request, res: Response) => {
  try {
    const { status, priority, talentId, dealId, excludeCompleted } = req.query;
    
    logInfo("Fetching unified tasks", {
      userId: req.user?.id,
      filters: { status, priority, talentId, dealId, excludeCompleted }
    });

    const tasks = await getUnifiedTasks({
      status: typeof status === "string" ? status : undefined,
      priority: typeof priority === "string" ? priority : undefined,
      talentId: typeof talentId === "string" ? talentId : undefined,
      dealId: typeof dealId === "string" ? dealId : undefined,
      excludeCompleted: excludeCompleted === "true",
    });

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logError("Error fetching unified tasks", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/tasks/due-today
 * Get all tasks due today across all models
 */
router.get("/due-today", async (req: Request, res: Response) => {
  try {
    const tasks = await getTasksDueToday();

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logError("Error fetching tasks due today", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch tasks due today",
    });
  }
});

/**
 * GET /api/tasks/due-tomorrow
 * Get all tasks due tomorrow across all models
 */
router.get("/due-tomorrow", async (req: Request, res: Response) => {
  try {
    const tasks = await getTasksDueTomorrow();

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logError("Error fetching tasks due tomorrow", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch tasks due tomorrow",
    });
  }
});

/**
 * GET /api/tasks/overdue
 * Get all overdue tasks across all models
 */
router.get("/overdue", async (req: Request, res: Response) => {
  try {
    const tasks = await getOverdueTasks();

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logError("Error fetching overdue tasks", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch overdue tasks",
    });
  }
});

/**
 * GET /api/tasks/talent/:talentId
 * Get all tasks linked to a specific talent across all models
 */
router.get("/talent/:talentId", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;

    if (!talentId) {
      return res.status(400).json({
        success: false,
        error: "Talent ID is required",
      });
    }

    const tasks = await getTasksByTalentId(talentId);

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logError("Error fetching talent tasks", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch talent tasks",
    });
  }
});

export default router;
