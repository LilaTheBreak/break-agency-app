import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active opportunities (public)
router.get('/public', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get all opportunities (admin only)
router.get('/', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    });
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create opportunity (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      brand,
      location,
      title,
      deliverables,
      payment,
      deadline,
      status,
      image,
      logo,
      type,
      isActive
    } = req.body;

    // Get user from session/token
    const createdBy = req.user?.id || 'system';

    const opportunity = await prisma.opportunity.create({
      data: {
        brand,
        location,
        title,
        deliverables,
        payment,
        deadline,
        status: status || 'Live brief · Login required to apply',
        image,
        logo,
        type,
        isActive: isActive !== undefined ? isActive : true,
        createdBy
      }
    });

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand,
      location,
      title,
      deliverables,
      payment,
      deadline,
      status,
      image,
      logo,
      type,
      isActive
    } = req.body;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        brand,
        location,
        title,
        deliverables,
        payment,
        deadline,
        status,
        image,
        logo,
        type,
        isActive
      }
    });

    res.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete opportunity (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.opportunity.delete({
      where: { id }
    });

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

export default router;
