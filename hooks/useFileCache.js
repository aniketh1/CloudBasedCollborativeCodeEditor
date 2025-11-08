// hooks/useFileCache.js
// Advanced file caching system with version control and room-level synchronization

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing file content cache with real-time synchronization
 * Prevents template overwrites and ensures consistent state across collaborators
 */
export const useFileCache = (roomId, socket) => {
  // Cache structure: Map<fileId, { content, version, lastModified, userId }>
  const [fileCache, setFileCache] = useState(new Map());
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const updateTimerRef = useRef(null);

  /**
   * Get file content from cache or return null if not cached
   */
  const getCachedFile = useCallback((fileId) => {
    if (!fileId) return null;
    return fileCache.get(fileId) || null;
  }, [fileCache]);

  /**
   * Update cache with new file content
   * Uses version tracking to prevent stale data overwrites
   */
  const updateCache = useCallback((fileId, content, version = null, userId = null) => {
    if (!fileId) return;

    setFileCache(prev => {
      const updated = new Map(prev);
      const existing = prev.get(fileId);
      
      // Only update if:
      // 1. File doesn't exist in cache, OR
      // 2. New version is higher than cached version, OR
      // 3. No version tracking (first write)
      const shouldUpdate = !existing || 
                          version === null || 
                          existing.version === undefined ||
                          version > existing.version;

      if (shouldUpdate) {
        updated.set(fileId, {
          content,
          version: version !== null ? version : (existing?.version || 0) + 1,
          lastModified: Date.now(),
          userId: userId || existing?.userId || 'unknown'
        });
        console.log(`📦 Cache updated: ${fileId} (v${version || 'auto'})`);
      } else {
        console.log(`⏭️ Cache update skipped: ${fileId} (stale version)`);
      }

      return updated;
    });
  }, []);

  /**
   * Check if cache has file and if it's fresh (< 30 seconds old)
   */
  const hasFreshCache = useCallback((fileId) => {
    const cached = fileCache.get(fileId);
    if (!cached) return false;
    
    const age = Date.now() - cached.lastModified;
    return age < 30000; // 30 seconds freshness threshold
  }, [fileCache]);

  /**
   * Mark file as pending update to prevent race conditions
   */
  const markPendingUpdate = useCallback((fileId) => {
    setPendingUpdates(prev => new Map(prev).set(fileId, Date.now()));
  }, []);

  /**
   * Clear pending update marker
   */
  const clearPendingUpdate = useCallback((fileId) => {
    setPendingUpdates(prev => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);

  /**
   * Check if file has pending update (and it's not stale)
   */
  const hasPendingUpdate = useCallback((fileId) => {
    const pendingTime = pendingUpdates.get(fileId);
    if (!pendingTime) return false;
    
    // Consider pending update stale after 5 seconds
    const age = Date.now() - pendingTime;
    if (age > 5000) {
      // Auto-clear stale pending updates
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(fileId);
        return updated;
      });
      return false;
    }
    
    return true;
  }, [pendingUpdates]);

  /**
   * Batch update multiple files (useful for initial load)
   */
  const batchUpdateCache = useCallback((files) => {
    if (!Array.isArray(files)) return;

    setFileCache(prev => {
      const updated = new Map(prev);
      files.forEach(file => {
        if (file.id && file.content !== undefined) {
          updated.set(file.id, {
            content: file.content,
            version: file.version || 0,
            lastModified: Date.now(),
            userId: file.userId || 'system'
          });
        }
      });
      console.log(`📦 Batch cache update: ${files.length} files`);
      return updated;
    });
  }, []);

  /**
   * Clear entire cache (useful for room cleanup)
   */
  const clearCache = useCallback(() => {
    console.log('🗑️ Cache cleared');
    setFileCache(new Map());
    setPendingUpdates(new Map());
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return {
      totalFiles: fileCache.size,
      pendingUpdates: pendingUpdates.size,
      cacheSize: JSON.stringify([...fileCache.entries()]).length,
      oldestEntry: Math.min(...Array.from(fileCache.values()).map(f => f.lastModified))
    };
  }, [fileCache, pendingUpdates]);

  /**
   * Listen to socket updates and sync cache
   */
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleCodeUpdate = (data) => {
      const { fileName, content, version, userId, fileId } = data;
      
      console.log(`🔄 Real-time update received: ${fileName} (v${version})`);
      
      // Update cache with versioned content
      if (fileId) {
        updateCache(fileId, content, version, userId);
      }
    };

    const handleFileSync = (data) => {
      const { files } = data;
      
      if (Array.isArray(files)) {
        console.log(`🔄 File sync received: ${files.length} files`);
        batchUpdateCache(files);
      }
    };

    socket.on('code-update', handleCodeUpdate);
    socket.on('file-sync', handleFileSync);

    return () => {
      socket.off('code-update', handleCodeUpdate);
      socket.off('file-sync', handleFileSync);
    };
  }, [socket, roomId, updateCache, batchUpdateCache]);

  /**
   * Auto-cleanup old cache entries (> 5 minutes)
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      setFileCache(prev => {
        const updated = new Map();
        let removedCount = 0;

        prev.forEach((value, key) => {
          if (now - value.lastModified < maxAge) {
            updated.set(key, value);
          } else {
            removedCount++;
          }
        });

        if (removedCount > 0) {
          console.log(`🗑️ Cache cleanup: Removed ${removedCount} stale entries`);
        }

        return updated;
      });
    }, 60000); // Run every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // Cache operations
    getCachedFile,
    updateCache,
    batchUpdateCache,
    clearCache,
    
    // Status checks
    hasFreshCache,
    hasPendingUpdate,
    
    // Pending update management
    markPendingUpdate,
    clearPendingUpdate,
    
    // Statistics
    getCacheStats,
    
    // Direct access (use with caution)
    fileCache
  };
};

export default useFileCache;
