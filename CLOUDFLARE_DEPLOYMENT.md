# Cloudflare Pages Deployment Guide

This document provides step-by-step instructions for deploying VidSimu Live to
Cloudflare Pages.

## Prerequisites

- Cloudflare account
- GitHub/GitLab repository with your code
- Firebase project configured

## Deployment Steps

### 1. Connect Repository to Cloudflare Pages

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create application** → **Connect to Git**
4. Select your repository and click **Begin setup**

### 2. Configure Build Settings

Set the following build configuration:

```
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

**Framework preset**: Vite

### 3. Environment Variables

Add the following environment variables in the Cloudflare Pages dashboard:

**Required:**

- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_DATABASE_URL` - Your Firebase database URL
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

**Optional:**

- `VITE_ADMIN_EMAIL` - Admin email for special privileges
- `VITE_R2_MUSIC_URL` - Cloudflare R2 bucket URL for background music

> **Important**: All environment variables must be prefixed with `VITE_` to be
> accessible in the application.

### 4. Deploy

1. Click **Save and Deploy**
2. Cloudflare Pages will automatically:
   - Clone your repository
   - Run `npm install`
   - Execute `npm run build`
   - Deploy the `dist/` folder to their global CDN

### 5. Custom Domain (Optional)

1. Go to your Pages project → **Custom domains**
2. Click **Set up a custom domain**
3. Follow the DNS configuration instructions

## Automatic Deployments

Cloudflare Pages automatically deploys:

- **Production**: Every push to your `main` branch
- **Preview**: Every push to other branches (creates preview URLs)

## Build Optimization

The project is already optimized for Cloudflare Pages:

✅ **SPA Routing**: `_redirects` file handles client-side routing ✅ **Security
Headers**: `_headers` file sets security and caching policies ✅ **Asset
Optimization**: Vite automatically hashes assets for cache-busting ✅ **Code
Splitting**: Automatic code splitting for optimal performance

## Deployment Features

### Included Configurations

- **`public/_redirects`**: Ensures all routes work with React Router
- **`public/_headers`**: Security headers and optimal caching
  - HTML: No cache (always fresh)
  - Assets: 1 year cache (immutable)
  - Fonts: 1 year cache
  - Images: 1 week cache

### Performance

Cloudflare Pages provides:

- Global CDN with 200+ data centers
- Automatic HTTPS
- HTTP/3 support
- Brotli compression
- Unlimited bandwidth

## Troubleshooting

### Build Failures

**Issue**: "Module not found" errors **Solution**: Ensure all dependencies are
in `package.json` (not devDependencies if needed at build time)

**Issue**: Environment variables not working **Solution**: Verify all variables
are prefixed with `VITE_` and set in Cloudflare Pages dashboard

### Routing Issues

**Issue**: 404 on page refresh **Solution**: Verify `_redirects` file exists in
`public/` folder

### Firebase Connection Issues

**Issue**: Firebase not initializing **Solution**: Double-check all Firebase
environment variables are correctly set

## CI/CD Integration

For advanced workflows, you can use Cloudflare Pages'
[Direct Upload API](https://developers.cloudflare.com/pages/platform/direct-upload/):

```bash
# Build locally
npm run build

# Deploy using Wrangler CLI
npx wrangler pages deploy dist --project-name=vidsimu-live
```

## Monitoring

Access deployment logs and analytics:

1. Go to your Pages project in Cloudflare Dashboard
2. Navigate to **Deployments** for build logs
3. Check **Analytics** for traffic and performance metrics

## Rollback

To rollback to a previous deployment:

1. Go to **Deployments**
2. Find the working deployment
3. Click **...** → **Rollback to this deployment**

---

For more information, visit the
[Cloudflare Pages documentation](https://developers.cloudflare.com/pages/).
