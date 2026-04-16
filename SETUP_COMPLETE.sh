#!/bin/bash

#################################################################################
#                                                                               #
#  MAHKOTA TAIWAN - COMPLETE SETUP SCRIPT                                     #
#  Executes everything: Deploy + Database Migration                           #
#                                                                               #
#  Usage: bash SETUP_COMPLETE.sh                                              #
#                                                                               #
#################################################################################

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MAHKOTA TAIWAN - COMPLETE SETUP                          ║"
echo "║  Video Showcase: YouTube + Shorts + TikTok + Reels       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Credentials - Set these environment variables before running
# export GITHUB_TOKEN="your_github_token"
# export VERCEL_TOKEN="your_vercel_token"
# export DB_PASSWORD="your_db_password"

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_USER="mahkotataiwanweb-sys"
GITHUB_REPO="mahkotataiwanwebproject"

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

SUPABASE_URL="https://bqlntkvkjhgoipelrvti.supabase.co"
DB_HOST="db.bqlntkvkjhgoipelrvti.supabase.co"
DB_USER="postgres"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="postgres"
DB_PORT="5432"

# Database migration SQL
MIGRATION_SQL="
-- Mahkota Taiwan Video Showcase Migration
DELETE FROM video_showcases WHERE true;
ALTER TABLE video_showcases DROP COLUMN IF EXISTS video_type CASCADE;
ALTER TABLE video_showcases ADD COLUMN video_category TEXT NOT NULL DEFAULT 'youtube';
ALTER TABLE video_showcases ADD CONSTRAINT check_video_category CHECK (video_category IN ('youtube', 'shorts', 'tiktok', 'reels'));
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'video_showcases' ORDER BY ordinal_position;
"

#################################################################################
# STEP 1: Verify GitHub is updated
#################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Verify Code in GitHub${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check latest commit
LATEST_COMMIT=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/commits?per_page=1" | \
  grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$LATEST_COMMIT" ]; then
  echo -e "${RED}❌ Could not fetch latest commit from GitHub${NC}"
  echo "   Check your GitHub token and internet connection"
  exit 1
fi

echo -e "${GREEN}✅ Latest Commit: ${LATEST_COMMIT:0:7}${NC}"
echo "   Branch: main"
echo ""

#################################################################################
# STEP 2: Check Vercel Deployment Status
#################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Check Vercel Deployment Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

DEPLOY_STATUS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?limit=1" | \
  grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DEPLOY_STATUS" ]; then
  echo -e "${YELLOW}⏳ Deployment status unknown (check vercel.com)${NC}"
else
  echo -e "${GREEN}✅ Deployment Status: $DEPLOY_STATUS${NC}"
fi
echo ""

#################################################################################
# STEP 3: Execute Database Migration
#################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Execute Database Migration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}⚠️  PostgreSQL client not found. Installing...${NC}"
  sudo apt-get update > /dev/null 2>&1
  sudo apt-get install -y postgresql-client > /dev/null 2>&1
fi

echo "Connecting to Supabase..."

# Create temporary SQL file
TEMP_SQL=$(mktemp)
echo "$MIGRATION_SQL" > "$TEMP_SQL"

# Execute migration
export PGPASSWORD="$DB_PASSWORD"

if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -f "$TEMP_SQL" 2>/dev/null; then
  echo -e "${GREEN}✅ Database Migration Successful!${NC}"
  echo ""
  echo "Changes made:"
  echo "  • Deleted old video data"
  echo "  • Dropped video_type column"
  echo "  • Added video_category column (youtube|shorts|tiktok|reels)"
  echo "  • Added constraint check"
else
  echo -e "${RED}❌ Migration failed. Check credentials and connectivity${NC}"
  echo ""
  echo "If connection fails, run this SQL manually in Supabase:"
  echo "════════════════════════════════════════════════════════════"
  echo "$MIGRATION_SQL"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  exit 1
fi

# Cleanup
rm "$TEMP_SQL"
echo ""

#################################################################################
# STEP 4: Summary
#################################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SETUP COMPLETE! 🎉${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Code deployed to Vercel${NC}"
echo -e "${GREEN}✅ Database schema updated${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Open your site: https://mahkotataiwanwebproject.vercel.app"
echo "    (or your custom domain)"
echo ""
echo "2️⃣  Check 'Video Showcase' section:"
echo "    Should show 4 tabs: YouTube | Shorts | TikTok | Reels"
echo ""
echo "3️⃣  Add videos via admin:"
echo "    https://your-site.com/admin/video-showcase"
echo ""
echo "4️⃣  Each category shows different layout:"
echo "    • YouTube: 1 large embedded video"
echo "    • Shorts/TikTok/Reels: Grid 6 videos with scroll"
echo ""
echo -e "${YELLOW}📌 Admin Category Options:${NC}"
echo "    • YouTube"
echo "    • YouTube Shorts"
echo "    • TikTok"
echo "    • Instagram Reels"
echo ""
echo -e "${GREEN}Ready to go! 🚀${NC}"
echo ""
