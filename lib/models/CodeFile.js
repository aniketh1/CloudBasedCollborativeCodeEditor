import clientPromise from '../mongodb.js';

export async function getFilesCollection() {
  const client = await clientPromise;
  const db = client.db('codedev');
  return db.collection('files');
}

export async function getFile(fileId) {
  try {
    const collection = await getFilesCollection();
    const file = await collection.findOne({ fileId });
    return file;
  } catch (error) {
    console.error('Error fetching file:', error);
    throw error;
  }
}

export async function saveFile(fileId, content, userId = null) {
  try {
    const collection = await getFilesCollection();
    const updatedAt = new Date();
    
    const result = await collection.updateOne(
      { fileId },
      {
        $set: {
          content,
          updatedAt,
          ...(userId && { lastEditedBy: userId })
        },
        $setOnInsert: {
          fileId,
          createdAt: updatedAt,
          createdBy: userId
        }
      },
      { upsert: true }
    );

    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

export async function createFile(fileId, initialContent = '', userId = null, metadata = {}) {
  try {
    const collection = await getFilesCollection();
    const now = new Date();
    
    const file = {
      fileId,
      content: initialContent,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastEditedBy: userId,
      metadata: {
        language: 'javascript',
        fileName: `file-${fileId}`,
        ...metadata
      }
    };

    const result = await collection.insertOne(file);
    return { ...file, _id: result.insertedId };
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
}

export async function deleteFile(fileId) {
  try {
    const collection = await getFilesCollection();
    const result = await collection.deleteOne({ fileId });
    return result;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function listFiles(userId = null, limit = 50, offset = 0) {
  try {
    const collection = await getFilesCollection();
    const query = userId ? { createdBy: userId } : {};
    
    const files = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
      
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}