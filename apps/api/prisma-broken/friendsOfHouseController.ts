import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
// import { emailService } from '../../services/emailService'; // Mock
// import { slackClient } from '../../integrations/slack/slackClient'; // Mock

const prisma = new PrismaClient();

// @desc    List all VIPs
// @route   GET /api/vip
// @access  Public (filtered by service layer if needed)
export const listVips = asyncHandler(async (req: Request, res: Response) => {
  const vips = await prisma.friendOfHouse.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  res.status(200).json(vips);
});

// @desc    Create a new VIP
// @route   POST /api/admin/vip
// @access  Private (Admin)
export const createVip = asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, avatarUrl, categories, instagram, tiktok, youtube, website } = req.body;
  const createdById = req.user!.id;

  const vip = await prisma.friendOfHouse.create({
    data: {
      name,
      bio,
      avatarUrl,
      categories,
      instagram,
      tiktok,
      youtube,
      website,
      createdById,
    },
  });

  // Send notifications
  // await emailService.sendVIPCreatedNotification(vip);
  // await slackClient.sendSlackAlert("New VIP added: " + vip.name);

  res.status(201).json(vip);
});

// @desc    Update a VIP
// @route   PUT /api/admin/vip/:id
// @access  Private (Admin)
export const updateVip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bio, avatarUrl, categories, instagram, tiktok, youtube, website } = req.body;

  const vip = await prisma.friendOfHouse.update({
    where: { id },
    data: {
      name,
      bio,
      avatarUrl,
      categories,
      instagram,
      tiktok,
      youtube,
      website,
    },
  });

  res.status(200).json(vip);
});

// @desc    Delete a VIP
// @route   DELETE /api/admin/vip/:id
// @access  Private (Admin)
export const deleteVip = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.friendOfHouse.delete({
    where: { id },
  });

  res.status(204).send();
});