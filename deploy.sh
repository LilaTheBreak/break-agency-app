#!/bin/bash

# Deployment script for Break Agency App to Vercel & Railway
# Deploys frontend to Vercel and backend to Railway

set -e

echo "=========================================="
echo "Break Agency App Deployment Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks...${NC}"
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}Error: vercel.json not found${NC}"
    exit 1
fi
if [ ! -f "railway.json" ]; then
    echo -e "${RED}Error: railway.json not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Config files found${NC}"

# Step 2: Build frontend
echo ""
echo -e "${YELLOW}Step 2: Building frontend...${NC}"
npm run build:web 2>&1 | tail -5
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Step 3: Deploy to Vercel
echo ""
echo -e "${YELLOW}Step 3: Deploying frontend to Vercel...${NC}"
echo "This will open your browser for authentication if needed."
echo ""

if vercel --prod; then
    echo -e "${GREEN}✓ Frontend deployed to Vercel${NC}"
else
    echo -e "${RED}✗ Vercel deployment failed${NC}"
    exit 1
fi

# Step 4: Deploy to Railway
echo ""
echo -e "${YELLOW}Step 4: Deploying backend to Railway...${NC}"
echo "This will open your browser for authentication if needed."
echo ""

if railway up; then
    echo -e "${GREEN}✓ Backend deployed to Railway${NC}"
else
    echo -e "${RED}✗ Railway deployment failed${NC}"
    exit 1
fi

# Step 5: Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete! ✓"
echo "==========================================${NC}"
echo ""
echo "Frontend: https://tbctbctbc.online"
echo "Backend: https://breakagencyapi-production.up.railway.app"
echo ""
echo "To check deployment status:"
echo "  Vercel: vercel projects"
echo "  Railway: railway environment"
echo ""
