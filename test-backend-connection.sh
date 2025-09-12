#!/bin/bash

echo "🚀 Testing Deployed Backend Connection"
echo "======================================"

# Get the backend URL
BACKEND_URL="https://cloudbasedcollborativecodeeditor-backend.onrender.com"
echo "🔗 Backend URL: $BACKEND_URL"

# Test basic health endpoint
echo ""
echo "📡 Testing Health Endpoint..."
if curl -s --connect-timeout 10 "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Health endpoint responding"
    curl -s "$BACKEND_URL/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/health"
else
    echo "❌ Health endpoint failed"
    exit 1
fi

# Test Socket.IO endpoint
echo ""
echo "🔌 Testing Socket.IO Endpoint..."
if curl -s --connect-timeout 10 "$BACKEND_URL/socket.io/" > /dev/null; then
    echo "✅ Socket.IO endpoint responding"
    curl -s "$BACKEND_URL/socket.io/" | head -1
else
    echo "❌ Socket.IO endpoint failed"
    exit 1
fi

# Test API endpoints
echo ""
echo "📊 Testing API Endpoints..."

# Test projects endpoint
echo "  • Projects API..."
if curl -s --connect-timeout 10 "$BACKEND_URL/api/projects?userId=test" > /dev/null; then
    echo "    ✅ Projects API responding"
else
    echo "    ❌ Projects API failed"
fi

# Test templates endpoint
echo "  • Templates API..."
if curl -s --connect-timeout 10 "$BACKEND_URL/api/projects/templates" > /dev/null; then
    echo "    ✅ Templates API responding"
else
    echo "    ❌ Templates API failed"
fi

echo ""
echo "🎉 Backend connectivity test completed!"
echo ""
echo "💡 To test in your application:"
echo "   1. Navigate to http://localhost:3000"
echo "   2. Sign in with your account"
echo "   3. Go to dashboard to test projects API"
echo "   4. Create or join an editor room to test Socket.IO"
echo "   5. Check browser console for connection logs"
echo ""
echo "🐛 Debug tips:"
echo "   • Check browser Network tab for failed requests"
echo "   • Look for 'Backend type: Production (Render)' in console logs"
echo "   • Use the Debug Panel in the editor for real-time connection status"