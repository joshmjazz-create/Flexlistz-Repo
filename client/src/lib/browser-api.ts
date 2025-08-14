import { browserStorage } from './browser-storage';
import { type Collection, type InsertCollection, type Item, type InsertItem } from "@shared/schema";

// Mock API responses to match the server API structure
export const browserAPI = {
  // Collections
  async getCollections() {
    const collections = await browserStorage.getCollections();
    return { ok: true, json: async () => collections };
  },

  async getCollection(id: string) {
    const collection = await browserStorage.getCollection(id);
    if (!collection) {
      return { ok: false, status: 404, json: async () => ({ error: 'Collection not found' }) };
    }
    return { ok: true, json: async () => collection };
  },

  async createCollection(data: InsertCollection) {
    const collection = await browserStorage.createCollection(data);
    return { ok: true, json: async () => collection };
  },

  async updateCollection(id: string, data: Partial<InsertCollection>) {
    const collection = await browserStorage.updateCollection(id, data);
    if (!collection) {
      return { ok: false, status: 404, json: async () => ({ error: 'Collection not found' }) };
    }
    return { ok: true, json: async () => collection };
  },

  async deleteCollection(id: string) {
    console.log('BrowserAPI.deleteCollection called with id:', id);
    const success = await browserStorage.deleteCollection(id);
    console.log('Delete collection result:', success);
    if (!success) {
      return { ok: false, status: 404, json: async () => ({ error: 'Collection not found' }) };
    }
    return { ok: true, json: async () => ({ success: true }) };
  },

  // Items
  async getItems(collectionId: string, params?: Record<string, string | string[]>) {
    console.log('BrowserAPI.getItems called with:', { collectionId, params });
    let items: Item[];
    
    if (params && Object.keys(params).length > 0) {
      // Filter items
      const { search, ...filters } = params;
      const searchQuery = typeof search === 'string' ? search : undefined;
      console.log('BrowserAPI calling filterItems with:', { collectionId, filters, searchQuery });
      items = await browserStorage.filterItems(collectionId, filters, searchQuery);
    } else {
      // Get all items
      console.log('BrowserAPI getting all items (no filters)');
      items = await browserStorage.getItems(collectionId);
    }
    
    return { ok: true, json: async () => items };
  },

  async getItem(id: string) {
    const item = await browserStorage.getItem(id);
    if (!item) {
      return { ok: false, status: 404, json: async () => ({ error: 'Item not found' }) };
    }
    return { ok: true, json: async () => item };
  },

  async createItem(data: InsertItem) {
    const item = await browserStorage.createItem(data);
    return { ok: true, json: async () => item };
  },

  async updateItem(id: string, data: Partial<InsertItem>) {
    const item = await browserStorage.updateItem(id, data);
    if (!item) {
      return { ok: false, status: 404, json: async () => ({ error: 'Item not found' }) };
    }
    return { ok: true, json: async () => item };
  },

  async deleteItem(id: string) {
    console.log('BrowserAPI.deleteItem called with id:', id);
    const success = await browserStorage.deleteItem(id);
    console.log('Delete item result:', success);
    if (!success) {
      return { ok: false, status: 404, json: async () => ({ error: 'Item not found' }) };
    }
    return { ok: true, json: async () => ({ success: true }) };
  },

  // Tags
  async getAvailableTags(collectionId: string) {
    const tags = await browserStorage.getAvailableTags(collectionId);
    console.log('Available tags for collection:', collectionId, tags);
    return { ok: true, json: async () => tags };
  },

  async getTagKeys() {
    const keys = await browserStorage.getTagKeys();
    return { ok: true, json: async () => keys };
  },

  async getTagValues(key: string) {
    const values = await browserStorage.getTagValues(key);
    return { ok: true, json: async () => values };
  },

  async getFieldValues(field: 'key' | 'composer' | 'style') {
    const values = await browserStorage.getFieldValues(field);
    return { ok: true, json: async () => values };
  },

  // Import
  async importItems(targetCollectionId: string, itemIds: string[]) {
    const result = await browserStorage.importItems(targetCollectionId, itemIds);
    return { ok: true, json: async () => result };
  },

  // File handling
  async uploadFile(file: File) {
    const fileId = await browserStorage.storeFile(file);
    return { 
      ok: true, 
      json: async () => ({ 
        objectPath: fileId,
        uploadURL: fileId
      })
    };
  },

  async getFileUrl(fileId: string) {
    const url = await browserStorage.getFileUrl(fileId);
    return url;
  },

  async getItemTags(itemId: string) {
    const tags = await browserStorage.getItemTags(itemId);
    return { ok: true, json: async () => tags };
  }
};

// Override fetch for API calls to use browser storage
const originalFetch = window.fetch;

export function setupBrowserAPI() {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Handle API routes
    if (url.startsWith('/api/')) {
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(init.body as string) : null;
      
      try {
        let result: any;
        
        if (url === '/api/collections' && method === 'GET') {
          result = await browserAPI.getCollections();
        } else if (url === '/api/collections' && method === 'POST') {
          result = await browserAPI.createCollection(body);
        } else if (url.startsWith('/api/collections/') && method === 'GET') {
          const id = url.split('/')[3];
          if (url.includes('/items')) {
            // Parse query parameters
            const urlObj = new URL(url, window.location.origin);
            const params: Record<string, string | string[]> = {};
            urlObj.searchParams.forEach((value, key) => {
              if (params[key]) {
                if (Array.isArray(params[key])) {
                  (params[key] as string[]).push(value);
                } else {
                  params[key] = [params[key] as string, value];
                }
              } else {
                params[key] = value;
              }
            });
            result = await browserAPI.getItems(id, params);
          } else {
            result = await browserAPI.getCollection(id);
          }
        } else if (url.startsWith('/api/collections/') && method === 'PUT') {
          const id = url.split('/')[3];
          result = await browserAPI.updateCollection(id, body);
        } else if (url.startsWith('/api/collections/') && method === 'DELETE') {
          const id = url.split('/')[3];
          console.log('Browser API handling delete collection:', id);
          result = await browserAPI.deleteCollection(id);
        } else if (url === '/api/items' && method === 'POST') {
          result = await browserAPI.createItem(body);
        } else if (url.startsWith('/api/items/') && method === 'GET') {
          const id = url.split('/')[3];
          result = await browserAPI.getItem(id);
        } else if (url.startsWith('/api/items/') && method === 'PUT') {
          const id = url.split('/')[3];
          result = await browserAPI.updateItem(id, body);
        } else if (url.startsWith('/api/items/') && method === 'DELETE') {
          const id = url.split('/')[3];
          console.log('Browser API handling delete item:', id);
          result = await browserAPI.deleteItem(id);
        } else if (url.startsWith('/api/collections/') && url.includes('/available-tags')) {
          const id = url.split('/')[3];
          result = await browserAPI.getAvailableTags(id);
        } else if (url === '/api/tags/keys') {
          result = await browserAPI.getTagKeys();
        } else if (url.startsWith('/api/tags/values/')) {
          const key = decodeURIComponent(url.split('/')[4]);
          result = await browserAPI.getTagValues(key);
        } else if (url.startsWith('/api/field-values/')) {
          const field = url.split('/')[3] as 'key' | 'composer' | 'style';
          result = await browserAPI.getFieldValues(field);
        } else if (url.includes('/import') && method === 'POST') {
          // Handle /api/collections/:id/import
          const targetCollectionId = url.split('/')[3];
          console.log('Browser API handling import request for collection:', targetCollectionId, 'with itemIds:', body.itemIds);
          result = await browserAPI.importItems(targetCollectionId, body.itemIds);
        } else if (url === '/api/objects/upload' && method === 'POST') {
          // Mock upload URL response
          result = { 
            ok: true, 
            json: async () => ({ 
              uploadURL: 'mock-upload-url' 
            })
          };
        } else if (url === '/api/lead-sheets' && method === 'PUT') {
          // Handle lead sheet upload completion
          result = { 
            ok: true, 
            json: async () => ({ 
              objectPath: body.leadSheetURL 
            })
          };
        } else {
          console.log('Browser API: Unhandled route:', method, url);
          // Fallback to original fetch for non-API requests
          return originalFetch(input, init);
        }
        
        // Create a mock Response object
        const responseData = await result.json();
        return new Response(JSON.stringify(responseData), {
          status: result.ok ? 200 : (result.status || 500),
          statusText: result.ok ? 'OK' : 'Error',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Browser API request error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
          status: 500,
          statusText: 'Error',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For non-API requests, use original fetch
    return originalFetch(input, init);
  };
}

// Restore original fetch function
export function restoreFetch() {
  window.fetch = originalFetch;
}