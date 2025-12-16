import type { Job } from 'bullmq';
import { buildAssetPack } from '../../services/assets/assetPackBuilder.js';
import { routeEmail } from '../../services/email/emailRoutingEngine.js';

/**
 * Worker to generate a talent asset pack.
 */
export default async function assetPackWorker(job: Job<{ aiPlanId: string; talentId: string }>) {
  const { aiPlanId, talentId } = job.data;
  console.log(`[WORKER] Building asset pack for plan ${aiPlanId} and talent ${talentId}`);
  await buildAssetPack(aiPlanId, talentId).catch(err => {
    console.error(`[WORKER ERROR] Asset pack generation failed for plan ${aiPlanId}:`, err);
    throw err;
  });

  // After the asset pack is built, trigger the email routing engine
  const assetPack = await prisma.talentAssetPack.findFirst({ where: { aiPlanId, talentId } });
  if (assetPack) {
    await routeEmail('ASSET_PACK_READY', { assetPackId: assetPack.id });
  }
}