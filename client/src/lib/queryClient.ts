import { QueryClient } from "@tanstack/react-query";
import { browserAPI } from "./browser-api";

// Simplified browser storage API request handler
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Browser API Request: ${method} ${url}`, data);
  
  try {
    const urlParts = url.split('/').filter(Boolean);
    let response;

    // Route API calls to browser storage
    if (url.includes('/collections')) {
      if (method === 'GET' && urlParts.length === 2) {
        response = await browserAPI.getCollections();
      } else if (method === 'GET' && urlParts.length === 3) {
        response = await browserAPI.getCollection(urlParts[2]);
      } else if (method === 'POST' && urlParts.length === 2) {
        response = await browserAPI.createCollection(data as any);
      } else if (method === 'PUT' && urlParts.length === 3) {
        response = await browserAPI.updateCollection(urlParts[2], data as any);
      } else if (method === 'DELETE' && urlParts.length === 3) {
        response = await browserAPI.deleteCollection(urlParts[2]);
      } else if (url.includes('/items')) {
        const collectionId = urlParts[2];
        response = await browserAPI.getItems(collectionId);
      }
    } else if (url.includes('/items')) {
      if (method === 'POST') {
        response = await browserAPI.createItem(data as any);
      } else if (method === 'PUT') {
        response = await browserAPI.updateItem(urlParts[2], data as any);
      } else if (method === 'DELETE') {
        response = await browserAPI.deleteItem(urlParts[2]);
      }
    } else if (url.includes('/tags/keys')) {
      response = await browserAPI.getTagKeys();
    } else if (url.includes('/tags/values')) {
      response = await browserAPI.getTagValues(urlParts[3]);
    }

    if (!response || !response.ok) {
      throw new Error(`API request failed: ${method} ${url}`);
    }

    return response as Response;
  } catch (error) {
    console.error('Browser API request error:', error);
    throw error;
  }
}

// Simple query function for browser storage
async function browserQueryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  const url = queryKey.join("/") as string;
  console.log(`Browser Query: ${url}`);
  
  try {
    let response;
    
    if (url === '/api/collections') {
      response = await browserAPI.getCollections();
    } else if (url.includes('/collections/') && !url.includes('/items')) {
      const id = url.split('/').pop();
      if (id) response = await browserAPI.getCollection(id);
    } else if (url.includes('/items')) {
      const urlParts = url.split('/');
      const collectionId = urlParts[2];
      response = await browserAPI.getItems(collectionId);
    } else if (url.includes('/tags/keys')) {
      response = await browserAPI.getTagKeys();
    } else if (url.includes('/tags/values/')) {
      const key = url.split('/').pop();
      if (key) response = await browserAPI.getTagValues(key);
    }

    if (!response || !response.ok) {
      throw new Error(`Query failed: ${url}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Browser query error:', error);
    throw error;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: browserQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});