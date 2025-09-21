import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the current user from Clerk
    const { userId, user } = auth();
    
    // If no user is authenticated, create a guest user
    let userInfo;
    if (userId && user) {
      userInfo = {
        id: userId,
        info: {
          name: user.fullName || user.firstName || 'User',
          email: user.emailAddresses?.[0]?.emailAddress || '',
          avatar: user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=random`,
          color: generateUserColor(userId)
        }
      };
    } else {
      // Guest user for testing
      const guestId = "guest-" + Math.random().toString(36).substr(2, 9);
      userInfo = {
        id: guestId,
        info: {
          name: `Guest ${guestId.slice(-4)}`,
          email: '',
          avatar: `https://ui-avatars.com/api/?name=Guest&background=random`,
          color: generateUserColor(guestId)
        }
      };
    }

    // Get room access permissions
    const roomId = request.body?.room;
    
    // Identify the user and return the result
    const session = liveblocks.prepareSession(
      userInfo.id,
      {
        userInfo: userInfo.info,
      }
    );

    // Give the user access to the room
    if (roomId) {
      session.allow(roomId, session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body } = await session.authorize();
    
    // Parse the body if it's a string to ensure proper JSON format
    let responseBody;
    if (typeof body === 'string') {
      try {
        responseBody = JSON.parse(body);
      } catch (e) {
        responseBody = body;
      }
    } else {
      responseBody = body;
    }
    
    // Set proper headers
    response.setHeader('Content-Type', 'application/json');
    
    // Return the response in the correct format
    return response.status(status).json(responseBody);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return response.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
}

// Generate a consistent color for a user based on their ID
function generateUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}