# Google Drive Sync - Production Setup Guide

## Overview
This guide explains how to enable Google Drive sync for all users of your Bible app.

## 1. Google Cloud Console Setup

### Create/Configure OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:

#### For Testing (Limited to 100 users)
- **Publishing Status**: Testing
- **User Type**: External
- Add test users manually in the "Audience" section

#### For Production (All users)
- **Publishing Status**: In production
- **User Type**: External
- Fill out all required fields:
  - App name: "Bible App"
  - User support email: your-email@domain.com
  - App logo (optional but recommended)
  - Application home page: https://yourdomain.com
  - Privacy policy link: https://yourdomain.com/privacy
  - Terms of service link: https://yourdomain.com/terms
  - Developer contact: your-email@domain.com

### Enable Google Drive API
1. Go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on it and press "Enable"

### Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - Name: "Bible App Web Client"
   - Authorized JavaScript origins:
     - http://localhost:3000 (for development)
     - https://yourdomain.com (for production)
     - https://www.yourdomain.com (if using www)
   - Authorized redirect URIs: (not needed for implicit flow)
5. Save and copy your Client ID and API Key

## 2. Environment Variables

### For Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key
   ```

### For Other Hosting Providers
Add to your production environment:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key
```

## 3. OAuth Verification (For Public Release)

If you want to release to unlimited users, you'll need Google verification:

### Requirements for Verification
1. **Privacy Policy**: Must explain:
   - What data you collect
   - How you use the data
   - That data is stored in user's own Google Drive
   - Data retention policies

2. **Terms of Service**: Must include:
   - User responsibilities
   - Service limitations
   - Liability disclaimers

3. **Domain Verification**:
   - Verify domain ownership in Google Search Console
   - Add to your OAuth consent screen

4. **Security Assessment** (if using sensitive scopes):
   - Not required for `drive.appdata` scope (which we use)
   - This scope only accesses app-specific folder

### Verification Process
1. Complete OAuth consent screen configuration
2. Click "Submit for Verification"
3. Fill out the verification form:
   - Explain app functionality
   - Justify scope usage (drive.appdata for syncing user's Bible study data)
   - Provide test accounts if requested
4. Wait 3-5 business days for review

## 4. User Instructions

Add these instructions to your app:

```markdown
## How to Enable Cloud Sync

1. Click "Sync Settings" in the app
2. Choose "Google Drive"
3. Click "Connect to Google Drive"
4. Sign in with your Google account
5. Grant permission for the app to store data in its app folder
6. Click "Sync Now" to backup your data

Your data is stored securely in a hidden folder in your Google Drive that only this app can access.
```

## 5. Important Considerations

### Data Privacy
- Data is stored in user's own Google Drive account
- App only accesses its dedicated app folder (`drive.appdata` scope)
- No data passes through your servers
- Each user's data is completely isolated

### Rate Limits
- Google Drive API: 1,000,000,000 requests per day
- Per-user limit: 1,000 requests per 100 seconds
- The app's current usage is minimal (a few requests per sync)

### Storage Limits
- App folder counts against user's Google Drive storage
- Current sync data is typically < 1MB per user
- Google provides 15GB free storage

### Token Expiration
- Access tokens expire after 1 hour
- The app automatically refreshes tokens
- In Testing mode: tokens expire after 7 days
- In Production mode: tokens don't expire (unless user revokes)

## 6. Testing Checklist

Before going live:
- [ ] Test with multiple Google accounts
- [ ] Verify sync works on different browsers
- [ ] Test token refresh after expiration
- [ ] Verify data persistence across devices
- [ ] Test conflict resolution
- [ ] Check error handling for API failures
- [ ] Test with slow/intermittent connections

## 7. Monitoring

Add logging to track:
- Successful syncs
- Failed syncs and error types
- Average sync data size
- Number of active users using sync

## 8. Cost

**Free tier includes:**
- Unlimited API requests (within quotas)
- No Google Cloud charges for Drive API
- No storage costs (uses user's storage)

**You only pay if:**
- You exceed Google Cloud's free tier for other services
- You add additional premium features

## Quick Start for Production

1. Set publishing status to "In production"
2. Add your production domain to authorized origins
3. Set environment variables in your hosting platform
4. Deploy your app
5. Users can now sync with their Google accounts!

## Troubleshooting

### "Access blocked" error
- Ensure user's email is in test users list (if in Testing mode)
- Or switch to Production mode for all users

### "Invalid origin" error
- Add your domain to Authorized JavaScript origins
- Include both https://domain.com and https://www.domain.com

### Sync not working after deployment
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure Google Drive API is enabled