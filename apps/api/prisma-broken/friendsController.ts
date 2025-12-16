import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';

const prisma = new PrismaClient();

// @desc    List all Friends of House
// @route   GET /api/admin/friends/list
// @access  Private (Admin)
export const listFriends = asyncHandler(async (req: Request, res: Response) => {
  const friends = await prisma.friendsOfHouse.findMany({
    orderBy: { name: 'asc' },
  });
  res.status(200).json(friends);
});

// @desc    Create a new Friend of House
// @route   POST /api/admin/friends/create
// @access  Private (Admin)
export const createFriend = asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, category, photoUrl, instagram, tiktok, youtube, website, customTags } = req.body;

  const friend = await prisma.friendsOfHouse.create({
    data: {
      name,
      bio,
      category,
      photoUrl,
      instagram,
      tiktok,
      youtube,
      website,
      customTags,
    },
  });

  res.status(201).json(friend);
});

// @desc    Update a Friend of House
// @route   POST /api/admin/friends/update/:id
// @access  Private (Admin)
export const updateFriend = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bio, category, photoUrl, instagram, tiktok, youtube, website, customTags } = req.body;

  const friend = await prisma.friendsOfHouse.update({
    where: { id },
    data: {
      name,
      bio,
      category,
      photoUrl,
      instagram,
      tiktok,
      youtube,
      website,
      customTags,
    },
  });

  res.status(200).json(friend);
});

// @desc    Delete a Friend of House
// @route   DELETE /api/admin/friends/delete/:id
// @access  Private (Admin)
export const deleteFriend = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.friendsOfHouse.delete({
    where: { id },
  });

  res.status(204).send();
});