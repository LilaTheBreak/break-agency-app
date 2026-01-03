#!/bin/bash
# Helper script to set DATABASE_URL and run migration

echo "=== CMS Migration Setup ==="
echo ""
echo "To get your DATABASE_URL:"
echo "1. Go to Railway Dashboard: https://railway.app"
echo "2. Select your project"
echo "3. Go to Variables tab"
echo "4. Copy the DATABASE_URL value"
echo ""
echo "Or if using Neon PostgreSQL:"
echo "1. Go to Neon Dashboard: https://console.neon.tech"
echo "2. Select your project"
echo "3. Go to Connection Details"
echo "4. Copy the connection string"
echo ""
read -p "Enter your DATABASE_URL (or press Enter to skip): " db_url

if [ -n "$db_url" ]; then
  # Add DATABASE_URL to .env file
  if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    # Update existing DATABASE_URL
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" .env
    echo "✅ Updated DATABASE_URL in .env"
  else
    # Add new DATABASE_URL
    echo "" >> .env
    echo "DATABASE_URL=$db_url" >> .env
    echo "✅ Added DATABASE_URL to .env"
  fi
  
  echo ""
  echo "Running migration..."
  npx prisma migrate deploy
else
  echo "⚠️  DATABASE_URL not set. Please set it manually in .env file:"
  echo "   DATABASE_URL=postgresql://user:password@host:5432/database"
  echo ""
  echo "Then run: npx prisma migrate deploy"
fi

