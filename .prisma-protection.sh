#!/usr/bin/env bash

# DATABASE RESET PROTECTION HOOK
# This script prevents accidental database resets using --force-reset
# It should be added to .bashrc or .zshrc to provide immediate protection

# Prevent --force-reset from being used directly
# This creates a safer wrapper around prisma db push

prisma_safe() {
  local args=("$@")
  
  # Check if this is a db push command with --force-reset
  if [[ "$*" == *"db push"* ]] && [[ "$*" == *"--force-reset"* ]]; then
    echo ""
    echo "🚨 DANGEROUS OPERATION BLOCKED 🚨"
    echo ""
    echo "You attempted to run: prisma db push --force-reset"
    echo "This DELETES ALL DATABASE DATA."
    echo ""
    echo "To safely reset the database, use:"
    echo "  • Development:  npm run db:safe-reset"
    echo "  • Staging:      npm run db:reset:staging"
    echo "  • Production:   npm run db:reset:prod (requires confirmation)"
    echo ""
    echo "To bypass this (NOT RECOMMENDED):"
    echo "  RUN_DANGEROUS=true npx prisma db push --force-reset"
    echo ""
    
    # Only allow if explicitly bypassed
    if [[ "$RUN_DANGEROUS" != "true" ]]; then
      return 1
    fi
  fi
  
  # Otherwise, run prisma normally
  npx prisma "${args[@]}"
}

# Only enable if not already set
if [[ -z "$PRISMA_PROTECTION_ENABLED" ]]; then
  export PRISMA_PROTECTION_ENABLED=1
  # Uncomment to use as shell function replacement:
  # alias prisma=prisma_safe
fi
