#!/bin/bash

# Frontend Environment Verification Script
# Run this to check if your environment is properly configured

echo "🔍 ColabDev Frontend Environment Check"
echo "======================================"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    
    # Check required environment variables
    if grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local; then
        echo "✅ Clerk publishable key configured"
    else
        echo "❌ Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local"
    fi
    
    if grep -q "CLERK_SECRET_KEY" .env.local; then
        echo "✅ Clerk secret key configured"
    else
        echo "❌ Missing CLERK_SECRET_KEY in .env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_BACKEND_URL" .env.local; then
        echo "✅ Backend URL configured"
        BACKEND_URL=$(grep "NEXT_PUBLIC_BACKEND_URL" .env.local | cut -d'=' -f2)
        echo "   Backend URL: $BACKEND_URL"
    else
        echo "❌ Missing NEXT_PUBLIC_BACKEND_URL in .env.local"
    fi
else
    echo "❌ .env.local file not found"
    echo "   Please create .env.local based on .env.example"
fi

echo ""
echo "🚀 Recommended Environment Configuration:"
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here"
echo "CLERK_SECRET_KEY=sk_test_your_secret_here"
echo "NEXT_PUBLIC_BACKEND_URL=https://cloudbasedcollborativecodeeditor-backend.onrender.com"
echo ""

# Test backend connectivity
echo "🌐 Testing backend connectivity..."
BACKEND_URL="https://cloudbasedcollborativecodeeditor-backend.onrender.com"

if curl -s --connect-timeout 10 "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend is reachable at $BACKEND_URL"
else
    echo "⚠️ Backend connectivity test failed"
    echo "   This might be normal if the backend is sleeping (Render free tier)"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Add your Clerk keys (get them from clerk.dev dashboard)"
echo "3. Verify backend URL is correct"
echo "4. For production: use pk_live_ and sk_live_ keys"