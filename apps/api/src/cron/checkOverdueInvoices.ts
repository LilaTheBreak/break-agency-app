import prisma from "../lib/prisma.js";
import { CronJobDefinition, parseCommaList } from "./types.js";
import { notifyInvoiceOverdue } from "../services/email/notifications.js";

const FINANCE_EMAILS = parseCommaList(process.env.FINANCE_ALERT_EMAILS);

export const checkOverdueInvoicesJob: CronJobDefinition = {
  name: "check-overdue-invoices",
  schedule: "0 9 * * *",
  description: "Scans for unpaid invoices and notifies finance if overdue.",
  handler: async () => {
    const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: { notIn: ["paid", "refunded"] },
        createdAt: { lt: threshold }
      },
      select: { id: true, amount: true, currency: true }
    });

    for (const payment of overduePayments) {
      for (const email of FINANCE_EMAILS) {
        await notifyInvoiceOverdue({
          email,
          invoice: `Payment ${payment.id}`,
          daysOverdue: Math.floor((Date.now() - threshold.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }

    return { overdueCount: overduePayments.length, notified: overduePayments.length * FINANCE_EMAILS.length };
  }
};
