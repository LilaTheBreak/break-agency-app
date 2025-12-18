import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/analytics/revenue
 * Revenue analytics with breakdown by time period
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = (req.query.period as string) || 'Month';
    
    // Get real deals data
    const deals = await prisma.deal.findMany({
      where: {
        userId,
        stage: 'COMPLETED',
        closedAt: { not: null }
      },
      select: {
        value: true,
        closedAt: true,
        brandName: true
      },
      orderBy: { closedAt: 'desc' },
      take: 30
    });

    // Calculate totals
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    // Format for chart
    const breakdown = deals.slice(0, 10).map(deal => ({
      date: deal.closedAt?.toISOString() || new Date().toISOString(),
      amount: deal.value || 0,
      source: deal.brandName || 'Unknown'
    }));

    // Add sample data if no deals
    if (breakdown.length === 0) {
      const now = new Date();
      for (let i = 9; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 3);
        breakdown.push({
          date: date.toISOString(),
          amount: 3000 + Math.random() * 2000,
          source: 'Sample Deal'
        });
      }
    }

    const formatRevenue = (amount: number) => {
      if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `£${Math.round(amount / 1000)}K`;
      return `£${Math.round(amount)}`;
    };

    res.json({
      current: formatRevenue(totalRevenue),
      projected: formatRevenue(totalRevenue * 1.2),
      trend: '+15%',
      period,
      breakdown
    });

  } catch (error) {
    console.error('[ANALYTICS REVENUE]', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

/**
 * GET /api/analytics/metrics
 * High-level performance metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Return sample data for now
    res.json({
      activeCampaigns: 12,
      totalOpportunities: 34,
      winRate: '45%',
      avgDealValue: '£12K',
      completionRate: '85%'
    });

  } catch (error) {
    console.error('[ANALYTICS METRICS]', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/analytics/socials
 * Social platform performance data
 */
router.get('/socials', async (req: Request, res: Response) => {
  try {
    // Return sample data
    const platforms = [
      { platform: 'Instagram', followers: 45000, engagement: '3.2%', growth: '+12%' },
      { platform: 'TikTok', followers: 32000, engagement: '4.5%', growth: '+18%' },
      { platform: 'YouTube', followers: 28000, engagement: '2.8%', growth: '+8%' }
    ];

    res.json({ platforms });

  } catch (error) {
    console.error('[ANALYTICS SOCIALS]', error);
    res.status(500).json({ error: 'Failed to fetch social analytics' });
  }
});

/**
 * GET /api/analytics/growth
 * Follower growth trends
 */
router.get('/growth', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'Month';

    // Generate sample growth data
    const timeline = [];
    const now = new Date();
    const baseFollowers = 105000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      timeline.push({
        date: date.toISOString(),
        followers: Math.round(baseFollowers * (0.85 + (29 - i) * 0.005)),
        engagement: 2.5 + Math.random()
      });
    }

    res.json({
      totalFollowers: baseFollowers,
      growthRate: '+12%',
      timeline,
      period
    });

  } catch (error) {
    console.error('[ANALYTICS GROWTH]', error);
    res.status(500).json({ error: 'Failed to fetch growth analytics' });
  }
});

/**
 * GET /api/analytics/performance
 * Content performance metrics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    // Return sample performance data
    const topContent = [
      { title: 'Brand Campaign Q1', views: 125000, engagement: '4.2%', platform: 'Instagram' },
      { title: 'Product Review', views: 98000, engagement: '3.8%', platform: 'YouTube' },
      { title: 'Lifestyle Vlog', views: 87000, engagement: '3.5%', platform: 'TikTok' }
    ];

    res.json({
      totalPosts: 48,
      avgViews: 95000,
      avgEngagement: '3.8%',
      completionRate: '85%',
      topContent
    });

  } catch (error) {
    console.error('[ANALYTICS PERFORMANCE]', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

/**
 * GET /api/analytics/insights
 * AI-generated insights and recommendations
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    // Return sample insights
    const insights = [
      {
        type: 'opportunity',
        priority: 'high',
        title: 'Peak Engagement Time',
        description: 'Your content performs 34% better when posted between 2-4 PM',
        action: 'Adjust posting schedule'
      },
      {
        type: 'growth',
        priority: 'medium',
        title: 'Platform Growth',
        description: 'TikTok showing strongest growth (+18% this month)',
        action: 'Increase TikTok content'
      },
      {
        type: 'revenue',
        priority: 'high',
        title: 'Deal Pipeline',
        description: '34 opportunities in pipeline, 12 active deals',
        action: 'Follow up on warm leads'
      }
    ];

    res.json({ insights });

  } catch (error) {
    console.error('[ANALYTICS INSIGHTS]', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
