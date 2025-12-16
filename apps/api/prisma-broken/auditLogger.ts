import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AuditEvent = 'created' | 'viewed' | 'signed' | 'sent' | 'resent';

/**
 * Logs an audit event to a SignatureRequest's audit log.
 * @param signatureRequestId The ID of the signature request.
 * @param event The type of event that occurred.
 * @param metadata Additional metadata about the event.
 */
export const logSignatureAuditEvent = async (
  signatureRequestId: string,
  event: AuditEvent,
  metadata: Record<string, any> = {}
) => {
  const request = await prisma.signatureRequest.findUnique({ where: { id: signatureRequestId } });
  if (!request) return;

  const newLogEntry = { event, timestamp: new Date().toISOString(), ...metadata };
  const existingLog = Array.isArray(request.auditLog) ? request.auditLog : [];

  await prisma.signatureRequest.update({
    where: { id: signatureRequestId },
    data: { auditLog: [...existingLog, newLogEntry] },
  });
};