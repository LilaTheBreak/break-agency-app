/**
 * DATABASE PROTECTION GUARDS
 * 
 * Hard safeguards to prevent accidental production database wipes.
 * These are code-level blocks that execute BEFORE any destructive operation.
 */

export function assertNotProduction(commandName: string): void {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    const msg = `
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║        🚨 PRODUCTION DATABASE PROTECTION ACTIVE 🚨                         ║
║                                                                            ║
║  Command "${commandName}" is BLOCKED in production environment.            ║
║                                                                            ║
║  This is a DESTRUCTIVE operation that would:                              ║
║    • DELETE all Talent records                                            ║
║    • DELETE all Deal records                                              ║
║    • DELETE all User accounts                                             ║
║    • DESTROY all platform data                                            ║
║    • ERASE all customer information                                       ║
║                                                                            ║
║  WHAT TO DO:                                                              ║
║    1. DO NOT attempt to run this command in production                    ║
║    2. If recovery is needed, contact DevOps team                          ║
║    3. Use manual Point-In-Time Recovery (PITR) procedures                 ║
║    4. Get explicit written approval before any recovery                   ║
║                                                                            ║
║  Current Environment: ${env.toUpperCase().padEnd(49, ' ')} ║
║  Timestamp: ${new Date().toISOString().padEnd(54, ' ')} ║
║  Command: ${commandName.padEnd(63, ' ')} ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
    `.trim();
    
    console.error(msg);
    throw new Error(`DATABASE_PROTECTION_ACTIVE: ${commandName} not allowed in production`);
  }
}

export function validateDatabaseEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Extract database host and name for logging
  let dbHost = 'unknown';
  let dbName = 'unknown';
  
  try {
    const parts = dbUrl.split('@');
    if (parts.length > 1) {
      dbHost = parts[1].split('/')[0];
      const remaining = parts[1].split('/')[1];
      if (remaining) {
        dbName = remaining.split('?')[0];
      }
    }
  } catch (e) {
    // Silently fail - we'll just use 'unknown'
  }
  
  // Log database environment on every start
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              🔐 DATABASE ENVIRONMENT VERIFICATION              ║
╠════════════════════════════════════════════════════════════════╣
║ Node Environment:   ${nodeEnv.toUpperCase().padEnd(50, ' ')} ║
║ Database Host:      ${dbHost.padEnd(50, ' ')} ║
║ Database Name:      ${dbName.padEnd(50, ' ')} ║
║ Timestamp:          ${new Date().toISOString().padEnd(50, ' ')} ║
║ Git Commit:         ${(process.env.GIT_COMMIT || 'unknown').padEnd(50, ' ')} ║
║ Deployment ID:      ${(process.env.DEPLOYMENT_ID || 'unknown').padEnd(50, ' ')} ║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  // Production environment checks
  if (nodeEnv === 'production') {
    // CRITICAL: Production should NEVER use localhost
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      const errorMsg = `
╔════════════════════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL: PRODUCTION POINTING TO LOCALHOST - DATABASE PROTECTION       ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Production environment is configured to use a LOCAL database.             ║
║  This is a CRITICAL CONFIGURATION ERROR.                                  ║
║                                                                            ║
║  What this means:                                                          ║
║    • Destructive operations would target LOCAL data, not production        ║
║    • This is actually a safety measure that prevented data loss!           ║
║    • But indicates serious deployment misconfiguration                     ║
║                                                                            ║
║  Required Action:                                                          ║
║    • DATABASE_URL must point to production Neon database                  ║
║    • Contact DevOps immediately - deployment is misconfigured             ║
║    • Do NOT proceed until production database is properly connected        ║
║                                                                            ║
║  Current DATABASE_URL contains: localhost or 127.0.0.1                    ║
║  Timestamp: ${new Date().toISOString().padEnd(50, ' ')} ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
      `;
      
      console.error(errorMsg);
      throw new Error(
        'CRITICAL: Production environment pointing to localhost database. ' +
        'DATABASE_URL must use production Neon database.'
      );
    }
    
    // Verify we're using Neon in production
    if (!dbUrl.includes('neon.tech')) {
      const warningMsg = `
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  WARNING: PRODUCTION DATABASE NOT ON NEON                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Expected production database to be on Neon (neon.tech)                    ║
║  but DATABASE_URL does not contain 'neon.tech'                             ║
║                                                                            ║
║  Timestamp: ${new Date().toISOString().padEnd(50, ' ')} ║
║                                                                            ║
║  This is a warning for visibility. If using different provider, this      ║
║  message can be suppressed by setting CUSTOM_DB_PROVIDER=true              ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
      `;
      
      if (!process.env.CUSTOM_DB_PROVIDER) {
        console.warn(warningMsg);
      }
    }
    
    console.log('✅ Production database environment verified');
  }
}

export interface DatabaseAuditEventDetails {
  timestamp?: string;
  operation: string;
  environment: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  reason?: string;
  additionalInfo?: Record<string, any>;
}

export function logDatabaseOperation(details: DatabaseAuditEventDetails): void {
  const auditEntry = {
    type: 'DB_OPERATION_AUDIT',
    timestamp: details.timestamp || new Date().toISOString(),
    operation: details.operation,
    environment: details.environment || process.env.NODE_ENV || 'development',
    nodeEnv: process.env.NODE_ENV || 'development',
    status: details.status,
    reason: details.reason,
    commitHash: process.env.GIT_COMMIT || process.env.GITHUB_SHA || 'unknown',
    nodeVersion: process.version,
    deploymentId: process.env.DEPLOYMENT_ID || process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
    deploymentEnv: process.env.RAILWAY_ENVIRONMENT_NAME || 'unknown',
    ...details.additionalInfo,
  };
  
  // Log to console (picked up by logging service/Sentry)
  console.log('[DB_AUDIT]', JSON.stringify(auditEntry));
  
  // Also emit as structured log
  if (console.debug) {
    console.debug('Database Operation:', auditEntry);
  }
}

export function getTelemetryMessage(operation: string, environment: string): string {
  return `Database operation audit: ${operation} in ${environment} at ${new Date().toISOString()}`;
}
