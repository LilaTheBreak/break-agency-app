import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { evaluateForApproval } from '../services/ai/approvalAI';

const prisma = new PrismaClient();

// @desc    Create a new approval request
// @route   POST /api/approvals/create
export const createApprovalRequest = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.body;
  const requesterId = req.user!.id;

  // 1. Run AI Assessment
  const aiAssessment = await evaluateForApproval(entityType, entityId);

  // 2. Find the latest version to increment it
  const lastRequest = await prisma.approvalRequest.findFirst({
    where: { entityType, entityId },
    orderBy: { version: 'desc' },
  });

  const newVersion = (lastRequest?.version || 0) + 1;

  const approvalRequest = await prisma.approvalRequest.create({
    data: {
      entityType,
      entityId,
      requesterId,
      aiAssessment,
      version: newVersion,
      status: 'pending',
    },
  });

  res.status(201).json(approvalRequest);
});

// @desc    Get all approval requests for an entity
// @route   GET /api/approvals/:entityType/:entityId
export const getApprovalHistory = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const history = await prisma.approvalRequest.findMany({
    where: { entityType, entityId },
    include: { comments: { include: { user: { select: { name: true, avatarUrl: true } } } }, requester: true },
    orderBy: { version: 'desc' },
  });
  res.status(200).json(history);
});

// @desc    Approve a request
// @route   POST /api/approvals/:id/approve
export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.approvalRequest.update({
    where: { id: req.params.id },
    data: { status: 'approved', reviewerId: req.user!.id },
  });
  res.status(200).json(request);
});

// @desc    Request edits on a request
// @route   POST /api/approvals/:id/request-edits
export const requestEdits = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const request = await prisma.approvalRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'needs_edits',
      reviewerId: req.user!.id,
      comments: {
        create: { userId: req.user!.id, message },
      },
    },
  });
  res.status(200).json(request);
});

// @desc    Add a comment to a request
// @route   POST /api/approvals/:id/comment
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const comment = await prisma.approvalComment.create({
    data: {
      approvalRequestId: req.params.id,
      userId: req.user!.id,
      message,
    },
  });
  res.status(201).json(comment);
});