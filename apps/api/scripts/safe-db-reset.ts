#!/usr/bin/env tsx
/**
 * SAFE DATABASE RESET SCRIPT
 * 
 * This script prevents accidental database resets in production.
 * - Development: Can reset with confirmation
 * - Production: Requires explicit environment variable + double confirmation
 * - Staging: Requires single confirmation
 * 
 * Usage:
 *   npm run db:safe-reset
 *   FORCE_DB_RESET=true npm run db:safe-reset  (for production)
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

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

  // Production requires explicit environment variable
  if (isProduction && !forceEnv) {
    console.error(
      '❌ PRODUCTION DATABASE PROTECTION ACTIVE\n' +
      'To reset production database, you must:\n' +
      '1. Set environment variable: FORCE_DB_RESET=true\n' +
      '2. Run: FORCE_DB_RESET=true npm run db:safe-reset\n'
    );
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
    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Database reset complete!');
    console.log('💡 Consider running: npm run seed:auth');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

safeReset();
