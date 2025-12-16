import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
// import { emailService } from '../../services/emailService';

const prisma = new PrismaClient();

// @desc    Submit a UGC application
// @route   POST /api/ugc/apply
export const submitUgcApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { portfolioUrl, categories, bio, sampleLinks, rates } = req.body;

  const application = await prisma.uGCApplication.upsert({
    where: { userId },
    create: { userId, portfolioUrl, categories, bio, sampleLinks, rates, status: 'pending' },
    update: { portfolioUrl, categories, bio, sampleLinks, rates, status: 'pending' },
  });

  // Notify admins of the new application
  // await emailService.send({ to: 'info@thebreakco.com', subject: 'New UGC Application', ... });

  res.status(201).json(application);
});

// @desc    Get the current user's UGC application
// @route   GET /api/ugc/application/my
export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await prisma.uGCApplication.findUnique({
    where: { userId: req.user!.id },
  });
  if (!application) {
    res.status(404).json({ message: 'No application found.' });
  } else {
    res.status(200).json(application);
  }
});

// @desc    List all UGC applications for admin review
// @route   GET /api/admin/ugc-applications
export const listUgcApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await prisma.uGCApplication.findMany({
    where: { status: 'pending' },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.status(200).json(applications);
});

// @desc    Approve a UGC application
// @route   POST /api/admin/ugc-applications/:id/approve
export const approveUgcApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const application = await prisma.uGCApplication.update({
    where: { id },
    data: { status: 'approved', adminNotes: 'Approved by admin.' },
  });

  // Update the user's profile to reflect their new status
  await prisma.user.update({
    where: { id: application.userId },
    data: {
      ugcApproved: true,
      include_in_roster: true,
      roster_category: 'UGC',
      ugcPortfolioUrl: application.portfolioUrl,
      ugcCategories: application.categories,
      ugcRates: application.rates,
    },
  });

  res.status(200).json(application);
});

// @desc    Reject a UGC application
// @route   POST /api/admin/ugc-applications/:id/reject
export const rejectUgcApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const application = await prisma.uGCApplication.update({
    where: { id },
    data: { status: 'rejected', adminNotes },
  });
  res.status(200).json(application);
});