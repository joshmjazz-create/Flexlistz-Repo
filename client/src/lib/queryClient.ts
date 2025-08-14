import { QueryClient } from '@tanstack/react-query';
import { browserAPI } from './browser-api';

// Completely rewritten query function for browser storage
async function browserQueryFn({ queryKey }: { queryKey: readonly unknown[] }) {
  const url = queryKey.join("/") as string;
  console.log(`Browser Query: ${url}`);
  
  // Parse URL parts (strip query string first)
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const [pathOnly, queryString] = cleanUrl.split('?');
  const parts = pathOnly.split('/').filter(p => p);
  console.log('URL parts:', parts);
  console.log('Query string:', queryString);
  
  try {
    let response;
    
    // Route based on exact URL pattern
    if (url === '/api/collections') {
      // GET /api/collections
      response = await browserAPI.getCollections();
      
    } else if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'collections') {
      // GET /api/collections/{id}
      const collectionId = parts[2];
      response = await browserAPI.getCollection(collectionId);
      
    } else if (parts[0] === 'api' && parts[1] === 'collections' && parts[3] === 'items') {
      // GET /api/collections/{id}/items (with optional query params)
      const collectionId = parts[2];
      
      // Parse query params from URL (handle both with and without query params)
      const urlObj = new URL(`http://localhost${url}`);
      const params: Record<string, string | string[]> = {};
      
      console.log('Query params from URL:', urlObj.search);
      urlObj.searchParams.forEach((value, key) => {
        console.log(`Query param: ${key} = ${value}`);
        if (key === 'filters') {
          try {
            const parsedFilters = JSON.parse(value);
            console.log('Parsed filters from URL:', parsedFilters);
            Object.assign(params, parsedFilters);
          } catch (e) {
            console.error('Failed to parse filters:', e);
          }
        } else {
          params[key] = value;
        }
      });
      
      console.log('Final params for BrowserAPI.getItems:', params);
      response = await browserAPI.getItems(collectionId, Object.keys(params).length > 0 ? params : undefined);
      
    } else if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'collections' && parts[3] === 'tags') {
      // GET /api/collections/{id}/tags
      const collectionId = parts[2];
      console.log('Getting available tags for collection:', collectionId);
      response = await browserAPI.getAvailableTags(collectionId);
      
    } else if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'items' && parts[3] === 'tags') {
      // GET /api/items/{id}/tags
      const itemId = parts[2];
      console.log('Getting item tags for item:', itemId);
      response = await browserAPI.getItemTags(itemId);
      
    } else if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'tags' && parts[2] === 'keys') {
      // GET /api/tags/keys
      response = await browserAPI.getTagKeys();
      
    } else if (parts.length === 4 && parts[0] === 'api' && parts[1] === 'tags' && parts[2] === 'values') {
      // GET /api/tags/values/{key}
      const key = parts[3];
      response = await browserAPI.getTagValues(key);
      
    } else if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'field-values') {
      // GET /api/field-values/{field}
      const field = parts[2] as 'key' | 'composer' | 'style';
      console.log('Getting field values for:', field);
      response = await browserAPI.getFieldValues(field);
      
    } else {
      console.warn('Unhandled URL pattern:', url, 'parts:', parts);
      throw new Error(`Unhandled URL pattern: ${url}`);
    }

    if (!response || !response.ok) {
      throw new Error(`Query failed: ${url}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Browser query error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
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

// Request helper function (signature compatible with mutations)
export async function apiRequest(method: string, url: string, data?: any) {
  console.log(`Browser API Request: ${method} ${url}`, data);
  
  try {
    // Handle DELETE requests directly
    if (method === 'DELETE') {
      const urlParts = url.split('/').filter(Boolean);
      console.log('DELETE request URL parts:', urlParts);
      
      if (urlParts[0] === 'api' && urlParts[1] === 'items' && urlParts.length === 3) {
        // DELETE /api/items/{id}
        const itemId = urlParts[2];
        console.log('Deleting item with ID:', itemId);
        const result = await browserAPI.deleteItem(itemId);
        if (result.ok) {
          return await result.json();
        } else {
          throw new Error(`Failed to delete item: ${result.status}`);
        }
      } else if (urlParts[0] === 'api' && urlParts[1] === 'collections' && urlParts.length === 3) {
        // DELETE /api/collections/{id}
        const collectionId = urlParts[2];
        console.log('Deleting collection with ID:', collectionId);
        const result = await browserAPI.deleteCollection(collectionId);
        if (result.ok) {
          return await result.json();
        } else {
          throw new Error(`Failed to delete collection: ${result.status}`);
        }
      } else {
        throw new Error(`Unsupported DELETE route: ${url}`);
      }
    } else {
      // For non-DELETE requests, use the fetch override
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  } catch (error) {
    console.error('Browser API request error:', error);
    throw error;
  }
}