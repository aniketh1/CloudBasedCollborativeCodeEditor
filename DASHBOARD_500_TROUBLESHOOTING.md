# Dashboard 500 Error - Troubleshooting Guide

## Problem
The dashboard page at `cloud-based-collborative-code-editor.vercel.app/dashboard` is showing a 500 error.

## Likely Causes & Solutions

### 1. Missing Environment Variables in Vercel
**Most Likely Cause**: Environment variables are not set in Vercel deployment.

**Solution**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```
5. Redeploy the application

### 2. Backend API Not Available
**Check**: If your backend is not deployed or accessible.

**Solution**:
- Deploy your backend to a service like Heroku, Railway, or Vercel
- Update `NEXT_PUBLIC_BACKEND_URL` to point to the deployed backend
- Test the backend endpoint directly: `curl https://your-backend-url.com/api/projects`

### 3. Authentication Configuration Issues
**Check**: Clerk authentication setup.

**Solution**:
- Verify Clerk keys are correct in Vercel environment variables
- Check Clerk dashboard for proper domain configuration
- Ensure middleware.js is configured correctly

### 4. Component Import Issues
**Status**: ✅ Fixed - All imports are correct

### 5. Debug Steps

#### Step 1: Check Environment Variables
Visit: `https://your-site.vercel.app/debug-env`
This will show which environment variables are set.

#### Step 2: Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Look for error logs in the server function
3. Check for specific error messages

#### Step 3: Test Backend Separately
Test your backend API directly:
```bash
curl -X GET "https://your-backend-url.com/api/projects?userId=mock-user-id"
```

#### Step 4: Check Browser Console
1. Open dashboard page
2. Open browser developer tools
3. Check Console and Network tabs for error messages

## Recent Fixes Applied
- ✅ Added proper error handling in fetchProjects()
- ✅ Added optional chaining for user.fullName
- ✅ Fixed authentication state handling
- ✅ Added comprehensive logging
- ✅ Added ErrorBoundary component
- ✅ Fixed import spacing issues

## Next Steps
1. Set environment variables in Vercel
2. Deploy your backend if not already deployed
3. Visit `/debug-env` page to verify configuration
4. Check Vercel function logs for specific errors
5. Test the dashboard again

## Quick Test Command
After setting environment variables, test locally:
```bash
npm run build && npm start
```

If it works locally but not in Vercel, the issue is definitely environment variables.