import prisma from '../../lib/prisma.js';
import { extractTextFromFile } from './fileExtractors.js';
import { analyzeContractAI } from './contractAnalyzer.js';
import { contractQueue } from '../../worker/queues.js';

export async function processContractReview({ userId, contractId }: { userId: string; contractId: string }) {
  const contract = await prisma.contractReview.findUnique({
    where: { id: contractId }
  });

  if (!contract) throw new Error("Contract not found");
  if (!contract.contractText) throw new Error("Contract text missing");

  try {
    const text = contract.contractText;
    const analysis = await analyzeContractAI(text);

    await prisma.contractReview.update({
      where: { id: contractId },
      data: {
        findings: {
          summary: analysis.summary,
          risks: analysis.risks,
          redlines: analysis.redlines,
          dealMapping: analysis.dealMapping,
        },
        riskScore: 0,
        status: "processed"
      }
    });

    // contractTerm model doesn't exist - skip term creation
    // if (analysis.terms) {
    //   for (const t of analysis.terms) {
    //     await prisma.contractTerm.create({
    //       data: {
    //         contractId,
    //         label: t.label,
    //         value: t.value,
    //         category: t.category
    //       }
    //     });
    //   }
    // }

    return { ok: true };
  } catch (err) {
    await prisma.contractReview.update({
      where: { id: contractId },
      data: { status: "failed" }
    });
    throw err;
  }
}

export async function enqueueContractProcessing(userId: string, contractId: string) {
  await contractQueue.add("contract-process", { userId, contractId });
}
