import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the current user from your authentication provider
    // For now, we'll use a mock user - replace this with your actual auth logic
    const user = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      info: {
        name: "Anonymous User",
        avatar: "https://via.placeholder.com/32x32.png?text=AU",
        color: "#" + Math.floor(Math.random()*16777215).toString(16)
      }
    };

    // You can also get room access permissions here
    // For example, check if user has access to the specific room
    const roomId = request.body?.room;
    
    // Identify the user and return the result
    const session = liveblocks.prepareSession(
      user.id,
      {
        userInfo: user.info,
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