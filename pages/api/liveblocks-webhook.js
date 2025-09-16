import * as Y from 'yjs';
import { WebhookHandler } from '@liveblocks/node';
import { saveFile } from '../../lib/models/CodeFile.js';

const webhookHandler = new WebhookHandler(process.env.LIVEBLOCKS_WEBHOOK_SECRET);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const body = JSON.stringify(request.body);
    const headers = request.headers;
    
    // Verify the webhook signature
    let event;
    try {
      event = webhookHandler.verifyRequest({
        headers: headers,
        rawBody: body,
      });
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return response.status(400).json({ message: 'Invalid signature' });
    }

    // Handle the ydocUpdated event
    if (event.type === 'ydocUpdated') {
      const { roomId, data } = event;
      
      try {
        // Apply the update to a new Yjs document
        const ydoc = new Y.Doc();
        
        // Apply the update data
        if (data && data.update) {
          const update = new Uint8Array(data.update);
          Y.applyUpdate(ydoc, update);
        }
        
        // Get the text content from the 'monaco' text type
        const ytext = ydoc.getText('monaco');
        const content = ytext.toString();
        
        // Save to MongoDB
        await saveFile(roomId, content, event.data?.userId || null);
        
        console.log(`Successfully saved file for room: ${roomId}`);
        
        // Clean up
        ydoc.destroy();
        
        return response.status(200).json({ 
          message: 'File saved successfully',
          roomId: roomId 
        });
        
      } catch (saveError) {
        console.error('Error saving file to MongoDB:', saveError);
        return response.status(500).json({ 
          message: 'Failed to save file',
          error: saveError.message 
        });
      }
    }

    // Handle other event types if needed
    console.log('Received event:', event.type);
    return response.status(200).json({ message: 'Event received' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return response.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}