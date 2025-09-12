# Production Clerk Configuration Guide

## ⚠️ CRITICAL: Middleware Error - MIDDLEWARE_INVOCATION_FAILED

The error `500: INTERNAL_SERVER_ERROR Code: MIDDLEWARE_INVOCATION_FAILED` indicates that the Clerk middleware is failing to execute properly. This is typically caused by missing or incorrect environment variables in production.

## 🔧 IMMEDIATE FIX REQUIRED in Vercel Dashboard

### Step 1: Get Production Keys from Clerk
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to **API Keys** section
4. Copy the **production** keys (not test keys):
   - `Publishable key` (starts with `pk_live_`)
   - `Secret key` (starts with `sk_live_`)

### Step 2: Set Environment Variables in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `cloud-based-collborative-code-editor`
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```bash
# Clerk Production Keys (CRITICAL - Must be set for middleware to work)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key_here
CLERK_SECRET_KEY=sk_live_your_production_secret_here

# Clerk URLs (Required for proper authentication flow)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Backend API URL (Set this to your deployed backend)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api-url.com

# Optional: Clerk domain configuration for production
NEXT_PUBLIC_CLERK_DOMAIN=your-custom-domain.com
```

⚠️ **IMPORTANT**: Without both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` properly set, the middleware will fail with `MIDDLEWARE_INVOCATION_FAILED` error.

### Step 3: Configure Clerk for Production Domain
1. In Clerk Dashboard, go to **Domains**
2. Add your production domain: `cloud-based-collborative-code-editor.vercel.app`
3. Ensure the domain is verified and active

### Step 4: Redeploy
After setting environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. OR trigger a new deployment by pushing to your repository

## 🚨 Current Issues Being Fixed:

### 1. Middleware Invocation Failed Error
- ✅ **Fixed**: Added error handling to middleware to prevent crashes
- ✅ **Fixed**: Added environment variable validation in middleware
- ✅ **Fixed**: Added graceful fallback to redirect to sign-in on middleware failure

### 2. React Hydration Errors
- ✅ **Fixed**: Added `ClientOnly` wrapper for client-side components
- ✅ **Fixed**: Added `suppressHydrationWarning` to theme provider

### 3. Dashboard 500 Errors
- ✅ **Fixed**: Improved error handling with user-friendly error messages
- ✅ **Fixed**: Added retry functionality for failed API calls

### 4. Backend API Connection
- ⚠️ **Action Required**: Set `NEXT_PUBLIC_BACKEND_URL` to your deployed backend
- If backend is not deployed yet, API calls will fail gracefully with error messages

## 📋 Deployment Checklist

- [ ] Set production Clerk keys in Vercel environment variables
- [ ] Configure Clerk domain for production
- [ ] Set backend API URL (if backend is deployed)
- [ ] Redeploy application
- [ ] Test authentication flow
- [ ] Verify dashboard loads without errors

## 🔍 Testing After Deployment

1. **Authentication**: Try signing in/up with a real email
2. **Dashboard**: Check if dashboard loads without 500 errors
3. **Browser Console**: Verify no React hydration errors
4. **Clerk Warning**: Should disappear after using production keys

## 💡 Notes

- Development keys have usage limits and are not meant for production
- Production keys provide better performance and no usage restrictions
- The application will work locally with development keys but needs production keys for Vercel deployment

## 🆘 If Issues Persist

1. Check Vercel function logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure Clerk domain configuration includes your production domain
4. Contact support if authentication still fails with production keys