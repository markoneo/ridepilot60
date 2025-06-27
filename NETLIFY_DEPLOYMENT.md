# Deploy RidePilot to Netlify

This guide will help you deploy your RidePilot transportation management system from GitHub to Netlify.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com) if you don't have one
3. **Environment Variables**: You'll need your Supabase credentials

## Step 1: Prepare Your GitHub Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Verify these files exist in your repository**:
   - ✅ `netlify.toml` (already configured)
   - ✅ `netlify/functions/server.ts` (already configured)
   - ✅ `package.json` with build scripts

## Step 2: Deploy to Netlify

### Option A: Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**:
   - Visit [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"

2. **Connect GitHub**:
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select your RidePilot repository

3. **Configure Build Settings**:
   - **Branch to deploy**: `main` (or your default branch)
   - **Build command**: `npm run build` (already configured)
   - **Publish directory**: `dist/public` (already configured)
   - Click "Deploy site"

### Option B: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and Deploy**:
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

In your Netlify dashboard:

1. **Go to Site Settings** → **Environment Variables**
2. **Add these required variables**:

   ```
   DATABASE_URL=your_postgresql_connection_string
   PGDATABASE=your_database_name
   PGHOST=your_database_host
   PGPASSWORD=your_database_password
   PGPORT=your_database_port
   PGUSER=your_database_user
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy again** to apply environment variables:
   - Go to **Deploys** tab
   - Click "Trigger deploy" → "Deploy site"

## Step 4: Custom Domain (Optional)

1. **Go to Domain Settings** in your Netlify dashboard
2. **Add custom domain** if you have one
3. **Enable HTTPS** (automatic with Netlify)

## Step 5: Verify Deployment

1. **Check your site URL** (provided by Netlify)
2. **Test these features**:
   - ✅ User authentication (login/signup)
   - ✅ Driver portal access
   - ✅ Trip management
   - ✅ Database connectivity
   - ✅ All API endpoints

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 20)

### Database Connection Issues
- Verify all environment variables are set correctly
- Check database URL format
- Ensure database allows connections from Netlify IPs

### Functions Not Working
- Check `netlify/functions/server.ts` exists
- Verify API routes in build logs
- Test function endpoints directly

### Frontend Issues
- Check browser console for errors
- Verify Supabase environment variables
- Test authentication flow

## Continuous Deployment

Once connected, Netlify will automatically:
- **Deploy on every push** to your main branch
- **Run build process** with `npm run build`
- **Deploy functions** automatically
- **Update environment** with zero downtime

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review function logs in dashboard
3. Test locally with `npm run dev`
4. Contact Netlify support if needed

## Next Steps

After successful deployment:
- Set up custom domain
- Configure form handling
- Enable branch previews
- Set up monitoring and analytics

Your RidePilot system will be live at: `https://your-site-name.netlify.app`