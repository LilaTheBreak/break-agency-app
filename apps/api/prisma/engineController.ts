import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { runNegotiationAnalysis } from '../../services/ai/negotiation/negotiationEngine';

const prisma = new PrismaClient();

// @desc    Run a full negotiation analysis on an inbound offer
// @route   POST /api/negotiation/analyse
export const analyseOffer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { emailBody, brandEmail, offerDetails } = req.body;

  const session = await runNegotiationAnalysis({
    userId,
    emailBody,
    brandEmail,
    offerDetails,
  });

  res.status(201).json(session);
});

// @desc    Generate strategy paths for an existing session
// @route   POST /api/negotiation/strategy-paths
export const getStrategyPaths = asyncHandler(async (req: Request, res: Response) => {
  // This would typically be part of the initial analysis, but can be exposed separately
  res.status(501).json({ message: 'Not implemented. Paths are generated during initial analysis.' });
});

// @desc    Run the auto-agent for one step
// @route   POST /api/negotiation/auto-agent/run
export const runAutoAgent = asyncHandler(async (req: Request, res: Response) => {
  // Check agent policy before proceeding
  // const policy = await prisma.agentPolicy.findUnique({ where: { userId: req.user!.id } });
  // if (!policy?.autoSendNegotiation) throw new Error('Auto-agent is not enabled.');
  res.status(501).json({ message: 'Auto-agent not implemented.' });
});