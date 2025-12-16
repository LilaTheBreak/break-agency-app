import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { postSchedulerQueue } from '../worker/queues/postSchedulerQueue.js';

const router = Router();

/**
 * GET /api/scheduled-posts
 * Lists all scheduled posts for a user.
 */
router.get('/', async (req, res) => {
  // In a real app, userId would come from req.user
  const posts = await prisma.scheduledPost.findMany({ where: { talent: { userId: 'clxrz45gn000008l4hy285p0g' } }, orderBy: { scheduledAt: 'asc' } });
  res.json(posts);
});

/**
 * POST /api/scheduled-posts
 * Creates a new scheduled post and adds it to the queue.
 */
router.post('/', async (req, res, next) => {
  try {
    const { deliverableId, talentId, platform, caption, mediaUrl, scheduledAt } = req.body;
    const post = await prisma.scheduledPost.create({
      data: { deliverableId, talentId, platform, caption, mediaUrl, scheduledAt: new Date(scheduledAt) },
    });

    const delay = new Date(scheduledAt).getTime() - Date.now();
    await postSchedulerQueue.add('publish-post', { scheduledPostId: post.id }, { delay: delay > 0 ? delay : 0 });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/scheduled-posts/:id
 * Cancels a scheduled post.
 */
router.delete('/:id', async (req, res) => {
  await prisma.scheduledPost.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
  // Logic to remove the job from BullMQ would go here
  res.status(204).send();
});

export default router;