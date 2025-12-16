import prisma from '../../lib/prisma.js';

export async function getFriends() {
  return prisma.friendsOfHouse.findMany({ orderBy: { name: 'asc' } });
}

export async function createFriend(data: {
  name: string;
  photoUrl?: string;
  bio?: string;
  socials?: any;
  categories?: string[];
}) {
  return prisma.friendsOfHouse.create({ data });
}

export async function updateFriend(id: string, data: Partial<{
  name: string;
  photoUrl?: string;
  bio?: string;
  socials?: any;
  categories?: string[];
}>) {
  return prisma.friendsOfHouse.update({ where: { id }, data });
}

export async function deleteFriend(id: string) {
  return prisma.friendsOfHouse.delete({ where: { id } });
}