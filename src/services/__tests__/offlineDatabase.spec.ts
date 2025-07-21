// Vitest unit tests for offlineDatabase
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  db,
  cacheBlogs,
  getCachedBlogs,
  getCachedBlog,
  addPendingOperation,
  getPendingOperations,
  removeOperation,
  syncPendingOperations
} from '../offlineDatabase';

// Mock HTTP methods
vi.mock('@/composables/useHTTPMethods', () => ({
  getHTTPPostResponse: vi.fn(async (url: string, data: any) => ({ data: { ...data, id: Math.floor(Math.random() * 10000) } })),
  getHTTPPatchResponse: vi.fn(async () => true),
  getHTTPDeleteResponse: vi.fn(async () => true),
}));

const sampleBlog = {
  id: 1,
  title: 'Test Blog',
  description: 'Test Desc',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  isSynced: false,
};

describe('offlineDatabase', () => {
  beforeEach(async () => {
    await db.blogs.clear();
    await db.pendingOperations.clear();
  });

  it('caches and retrieves blogs', async () => {
    await cacheBlogs([sampleBlog]);
    const blogs = await getCachedBlogs();
    expect(blogs.length).toBe(1);
    expect(blogs[0].title).toBe('Test Blog');
    const blog = await getCachedBlog(1);
    expect(blog?.description).toBe('Test Desc');
  });

  it('adds and retrieves pending operations', async () => {
    const opId = await addPendingOperation('CREATE', sampleBlog, '/blogs/');
    const ops = await getPendingOperations();
    expect(ops.length).toBe(1);
    expect(ops[0].type).toBe('CREATE');
    expect(ops[0].data.title).toBe('Test Blog');
    await removeOperation(opId);
    const opsAfter = await getPendingOperations();
    expect(opsAfter.length).toBe(0);
  });

  it('syncs pending CREATE operation', async () => {
    await addPendingOperation('CREATE', sampleBlog, '/blogs/');
    await syncPendingOperations();
    const blogs = await getCachedBlogs();
    expect(blogs.length).toBe(1);
    expect(blogs[0].isSynced).toBe(true);
    const ops = await getPendingOperations();
    expect(ops.length).toBe(0);
  });

  it('syncs pending UPDATE operation', async () => {
    await cacheBlogs([{ ...sampleBlog, isSynced: false }]);
    await addPendingOperation('UPDATE', { ...sampleBlog, title: 'Updated' }, '/blogs/');
    await syncPendingOperations();
    const blogs = await getCachedBlogs();
    expect(blogs[0].title).toBe('Updated');
    expect(blogs[0].isSynced).toBe(true);
    const ops = await getPendingOperations();
    expect(ops.length).toBe(0);
  });

  it('syncs pending DELETE operation', async () => {
    await cacheBlogs([sampleBlog]);
    await addPendingOperation('DELETE', { id: 1 }, '/blogs/');
    await syncPendingOperations();
    const blogs = await getCachedBlogs();
    expect(blogs.length).toBe(0);
    const ops = await getPendingOperations();
    expect(ops.length).toBe(0);
  });
}); 