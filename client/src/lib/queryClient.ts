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
    return { error: error.message };
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

// Request helper function
export async function apiRequest(url: string, options: RequestInit = {}) {
  console.log(`Browser API Request: ${options.method || 'GET'} ${url}`, options.body);
  
  try {
    const result = await browserAPI.request(url, options.method as any, options.body ? JSON.parse(options.body as string) : undefined);
    return result;
  } catch (error) {
    console.error('Browser API request error:', error);
    throw error;
  }
}