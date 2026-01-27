#!/usr/bin/env tsx
/**
 * SAFE DATABASE RESET SCRIPT
 * 
 * This script prevents accidental database resets in production.
 * - Development: Can reset with confirmation
 * - Production: PERMANENTLY BLOCKED (use manual PITR recovery)
 * - Staging: Requires double confirmation
 * 
 * Usage:
 *   npm run db:safe-reset              (development only)
 *   NODE_ENV=staging npm run db:reset:staging  (staging with confirmation)
 * 
 * Production resets are NOT ALLOWED. Use Neon's PITR recovery instead.
 */

import { execSync } from 'child_process';
import * as readline from 'readline';
import { assertNotProduction, logDatabaseOperation } from '../src/lib/dbGuards.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function safeReset() {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  const isProduction = env === 'production';
  const isStaging = env === 'staging';
  const forceEnv = process.env.FORCE_DB_RESET === 'true';

  console.log('\n🚨 DATABASE RESET UTILITY 🚨\n');
  console.log(`Environment: ${env.toUpperCase()}`);
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

  // HARD BLOCK for production - NO EXCEPTIONS
  if (isProduction) {
    const blockedMsg = `
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║        🚨 PRODUCTION DATABASE RESET PERMANENTLY BLOCKED 🚨                 ║
║                                                                            ║
║  This script will NOT reset the production database under ANY circumstances║
║                                                                            ║
║  If production database recovery is needed:                                ║
║    1. Contact DevOps team immediately                                      ║
║    2. Do NOT attempt manual resets                                         ║
║    3. Use Neon's Point-In-Time Recovery (PITR) instead                    ║
║    4. Get written approval before recovery                                 ║
║                                                                            ║
║  Environment: PRODUCTION (${env})                                          ║
║  Timestamp: ${new Date().toISOString()}                                   ║
║                                                                            ║
║  This protection cannot be overridden.                                     ║
║  Even if FORCE_DB_RESET=true is set, production resets are blocked.       ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
    `;
    
    console.error(blockedMsg);
    
    logDatabaseOperation({
      operation: 'ATTEMPTED_DB_RESET',
      environment: env,
      status: 'BLOCKED',
      reason: 'Production resets permanently blocked',
      additionalInfo: {
        forceEnvSet: forceEnv,
        timestamp: new Date().toISOString(),
        permanentlyBlocked: true,
      },
    });
    
    rl.close();
    process.exit(1);
  }

  // First confirmation
  const confirm1 = await question(
    '⚠️  This will DELETE ALL DATA in the database.\n' +
    'Type "yes, delete all data" to continue: '
  );

  if (confirm1 !== 'yes, delete all data') {
    console.log('❌ Reset cancelled.');
    rl.close();
    process.exit(0);
  }

  // Additional confirmation for production/staging
  if (!isDevelopment) {
    console.log('\n🔴 ADDITIONAL CONFIRMATION REQUIRED FOR ' + env.toUpperCase());
    const confirm2 = await question(
      `Type the environment name (${env.toUpperCase()}) to confirm: `
    );

    if (confirm2 !== env.toUpperCase()) {
      console.log('❌ Reset cancelled.');
      rl.close();
      process.exit(0);
    }
  }

  // Final warning - show what will be deleted
  console.log('\n📋 THIS WILL DELETE:');
  console.log('  • All Talent records');
  console.log('  • All Deal records');
  console.log('  • All User accounts');
  console.log('  • All Assets and IP records');
  console.log('  • All Enterprise Metrics');
  console.log('  • ALL DATA IN DATABASE');

  const finalConfirm = await question(
    '\nType "I understand, reset now" to proceed: '
  );

  if (finalConfirm !== 'I understand, reset now') {
    console.log('❌ Reset cancelled.');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n⏳ Resetting database...');
    
    logDatabaseOperation({
      operation: 'DB_RESET_STARTED',
      environment: env,
      status: 'STARTED',
      additionalInfo: {
        commitHash: process.env.GIT_COMMIT || 'unknown',
      },
    });
    
    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log('✅ Database reset complete!');
    
    logDatabaseOperation({
      operation: 'DB_RESET_COMPLETED',
      environment: env,
      status: 'COMPLETED',
      additionalInfo: {
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('💡 Consider running: npm run seed:auth');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    
    logDatabaseOperation({
      operation: 'DB_RESET_FAILED',
      environment: env,
      status: 'FAILED',
      reason: error instanceof Error ? error.message : String(error),
    });
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

safeReset();
