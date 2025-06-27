#!/bin/bash

# RidePilot - Netlify Deployment Setup Script
# This script helps prepare your project for GitHub to Netlify deployment

echo "🚀 RidePilot - Netlify Deployment Setup"
echo "========================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository. Initializing..."
    git init
    echo "✅ Git repository initialized"
fi

# Check for required files
echo ""
echo "📋 Checking deployment files..."

files_to_check=(
    "netlify.toml"
    "netlify/functions/server.ts"
    "package.json"
    "NETLIFY_DEPLOYMENT.md"
)

all_files_exist=true

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo "✅ All required files present"
else
    echo "❌ Some files are missing. Please ensure all files are in place."
    exit 1
fi

# Check package.json for required scripts
echo ""
echo "📋 Checking build scripts..."

if grep -q '"build"' package.json; then
    echo "✅ Build script found in package.json"
else
    echo "❌ Build script missing in package.json"
    exit 1
fi

# Stage files for commit
echo ""
echo "📦 Preparing files for GitHub..."

git add .
echo "✅ Files staged for commit"

# Check git status
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "📝 Changes ready to commit:"
    git diff --cached --name-only
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Commit your changes: git commit -m 'Prepare for Netlify deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Follow the guide in NETLIFY_DEPLOYMENT.md"
echo ""
echo "📖 Environment Variables Needed:"
echo "   - DATABASE_URL"
echo "   - VITE_SUPABASE_URL" 
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER"
echo ""
echo "🌐 Your site will be live at: https://your-site-name.netlify.app"
echo ""
echo "✨ Ready for deployment!"