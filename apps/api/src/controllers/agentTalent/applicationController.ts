import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Submit agent application with CV
 * POST /api/agent-talent/application
 */
export async function submitAgentApplication(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'CV file is required' });
    }

    const { experienceNotes } = req.body;

    // In production, upload to S3/cloud storage
    // For now, store file path (in real app would be S3 URL)
    const cvFileUrl = `/uploads/cv/${userId}_${Date.now()}_${file.originalname}`;

    // Check if application already exists
    const existing = await prisma.agentApplication.findUnique({
      where: { userId }
    });

    let application;
    if (existing) {
      // Update existing application
      application = await prisma.agentApplication.update({
        where: { userId },
        data: {
          cvFileUrl,
          experienceNotes: experienceNotes || null,
          status: 'pending',
          submittedAt: new Date()
        }
      });
    } else {
      // Create new application
      application = await prisma.agentApplication.create({
        data: {
          userId,
          cvFileUrl,
          experienceNotes: experienceNotes || null,
          status: 'pending'
        }
      });
    }

    // Mark user onboarding as complete
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        onboarding_status: 'pending_review'
      }
    });

    // Clean up temporary file
    if (file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('[AGENT APP] Failed to delete temp file:', err);
      }
    }

    return res.status(200).json({
      success: true,
      application: {
        id: application.id,
        cvFileUrl: application.cvFileUrl,
        experienceNotes: application.experienceNotes,
        status: application.status,
        submittedAt: application.submittedAt
      }
    });
  } catch (error) {
    console.error('[AGENT APPLICATION] Error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}

/**
 * Get my agent application
 * GET /api/agent-talent/application/my
 */
export async function getMyApplication(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const application = await prisma.agentApplication.findUnique({
      where: { userId }
    });

    if (!application) {
      return res.status(404).json({ error: 'No application found' });
    }

    return res.status(200).json({
      application: {
        id: application.id,
        cvFileUrl: application.cvFileUrl,
        experienceNotes: application.experienceNotes,
        status: application.status,
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt
      }
    });
  } catch (error) {
    console.error('[AGENT APPLICATION] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch application' });
  }
}
