import Dexie, { type Table } from 'dexie';
import type { Blog } from '@/types/blog';
import { toast } from 'vue3-toastify';

export interface PendingOperation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  url: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
  retryCount?: number;
  lastRetry?: string;
}

class OfflineDatabase extends Dexie {
  blogs!: Table<Blog, number>;
  pendingOperations!: Table<PendingOperation, number>;

  constructor() {
    super('BlogPwaDatabase');
    this.version(3).stores({ // Incremented version for fresh DB
      blogs: '++id, title, description, is_active, created_at, updated_at',
      pendingOperations: '++id, type, status, timestamp',
    });
  }
}
// Reminder: After this change, clear the IndexedDB database in DevTools before testing again.

export const db = new OfflineDatabase();

// Helper functions for blog operations
export const getCachedBlogs = async (): Promise<Blog[]> => {
  try {
    return await db.blogs.toArray();
  } catch (e) {
    toast.error('Failed to read from cache. IndexedDB may be unavailable.');
    return [];
  }
};

export const cacheBlogs = async (blogs: Blog[]): Promise<void> => {
  try {
    console.log('Caching blogs:', blogs); // Extra debug
    await db.blogs.bulkPut(blogs); // Use upsert for robustness
    console.log('Successfully cached blogs');
  } catch (e) {
    console.error('Dexie bulkPut error:', e);
    toast.error('Failed to write to cache. IndexedDB may be unavailable. Try reloading the page or check your browser settings.');
  }
};

export const getCachedBlog = async (id: number): Promise<Blog | undefined> => {
  try {
    return await db.blogs.get(id);
  } catch (e) {
    toast.error('Failed to read from cache. IndexedDB may be unavailable.');
    return undefined;
  }
};

export const addPendingOperation = async (
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  data: any,
  url: string
): Promise<number> => {
  try {
    return await db.pendingOperations.add({
      type,
      data,
      url,
      timestamp: Date.now(),
      status: 'pending',
    });
  } catch (e) {
    toast.error('Failed to queue offline operation. IndexedDB may be unavailable.');
    return -1;
  }
};

export const getPendingOperations = async (): Promise<PendingOperation[]> => {
  try {
    return await db.pendingOperations.where('status').equals('pending').toArray();
  } catch (e) {
    toast.error('Failed to read pending operations from cache. IndexedDB may be unavailable.');
    return [];
  }
};

export const updateOperationStatus = async (
  id: number,
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  error?: string
): Promise<void> => {
  try {
    await db.pendingOperations.update(id, { status });
  } catch (e) {
    toast.error('Failed to update offline operation status. IndexedDB may be unavailable.');
  }
};

export const removeOperation = async (id: number): Promise<void> => {
  try {
    await db.pendingOperations.delete(id);
  } catch (e) {
    toast.error('Failed to remove offline operation. IndexedDB may be unavailable.');
  }
};

// Track in-progress sync to prevent duplicates
let isSyncing = false;

// Sync function to be called when online
export const syncPendingOperations = async (): Promise<void> => {
  // Prevent multiple concurrent syncs
  if (isSyncing) return;
  
  isSyncing = true;
  
  try {
    // Get all pending operations, ordered by timestamp
    const operations = await db.pendingOperations
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
    
    if (operations.length === 0) return;
    
    console.log(`Syncing ${operations.length} pending operations...`);
    
    for (const op of operations) {
      try {
        // Mark as syncing
        await db.pendingOperations.update(op.id!, { status: 'syncing' });
        
        // Execute the operation
        switch (op.type) {
          case 'CREATE': {
            const response = await getHTTPPostResponse(op.url, op.data);
            if (response && response.data) {
              // Update the local cache with the server-generated ID
              const responseData = response.data;
              if (responseData.id) {
                await db.blogs.put({
                  ...op.data,
                  id: responseData.id,
                  isSynced: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            }
            break;
          }
          case 'UPDATE': {
            await getHTTPPatchResponse(`${op.url}${op.data.id}/`, op.data);
            // Update local cache
            await db.blogs.update(op.data.id, {
              ...op.data,
              isSynced: true,
              updated_at: new Date().toISOString()
            });
            break;
          }
          case 'DELETE': {
            await getHTTPDeleteResponse(`${op.url}${op.data.id}/`);
            // Remove from local cache
            await db.blogs.delete(op.data.id);
            break;
          }
        }
        
        // Only remove if the operation was successful
        await db.pendingOperations.delete(op.id!);
      } catch (error) {
        console.error('Sync failed for operation:', op, error);
        await db.pendingOperations.update(op.id!, { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: (op.retryCount || 0) + 1,
          lastRetry: new Date().toISOString()
        });
      }
    }
    
    console.log('Sync completed');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    isSyncing = false;
  }
};

// Check network status and sync if online
const handleNetworkChange = () => {
  if (navigator.onLine) {
    syncPendingOperations();
  }
};

// Listen for network status changes
window.addEventListener('online', handleNetworkChange);
window.addEventListener('offline', handleNetworkChange);

// Import HTTP methods
import { 
  getHTTPPostResponse, 
  getHTTPPatchResponse, 
  getHTTPDeleteResponse 
} from '@/composables/useHTTPMethods';
