import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { browserAPI } from "./browser-api";

// Browser storage API request handler
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Parse the URL to determine which browser API method to call
  const urlParts = url.split('/').filter(Boolean);
  
  try {
    let response;
    
    if (url.includes('/collections')) {
      if (method === 'GET' && urlParts.length === 2) {
        // GET /api/collections
        response = await browserAPI.getCollections();
      } else if (method === 'GET' && urlParts.length === 3) {
        // GET /api/collections/:id
        const id = urlParts[2];
        response = await browserAPI.getCollection(id);
      } else if (method === 'POST' && urlParts.length === 2) {
        // POST /api/collections
        response = await browserAPI.createCollection(data as any);
      } else if (method === 'PUT' && urlParts.length === 3) {
        // PUT /api/collections/:id
        const id = urlParts[2];
        response = await browserAPI.updateCollection(id, data as any);
      } else if (method === 'DELETE' && urlParts.length === 3) {
        // DELETE /api/collections/:id
        const id = urlParts[2];
        response = await browserAPI.deleteCollection(id);
      } else if (url.includes('/items')) {
        // GET /api/collections/:id/items
        const collectionId = urlParts[2];
        const searchParams = new URLSearchParams(window.location.search);
        const params: Record<string, string | string[]> = { collectionId };
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
        response = await browserAPI.getItems(collectionId, params);
      }
    } else if (url.includes('/items')) {
      if (method === 'POST') {
        // POST /api/items
        response = await browserAPI.createItem(data as any);
      } else if (method === 'PUT') {
        // PUT /api/items/:id
        const id = urlParts[2];
        response = await browserAPI.updateItem(id, data as any);
      } else if (method === 'DELETE') {
        // DELETE /api/items/:id
        const id = urlParts[2];
        response = await browserAPI.deleteItem(id);
      }
    } else if (url.includes('/tags/keys')) {
      // GET /api/tags/keys
      response = await browserAPI.getTagKeys();
    } else if (url.includes('/tags/values')) {
      // GET /api/tags/values/:key
      const key = urlParts[3];
      response = await browserAPI.getTagValues(key);
    }

    if (!response) {
      throw new Error(`Unsupported API endpoint: ${method} ${url}`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response as Response;
  } catch (error) {
    console.error('Browser API request failed:', error);
    throw error;
  }
}

// Browser storage query function
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    try {
      let response;
      
      if (url.includes('/collections') && !url.includes('/items')) {
        if (url === '/api/collections') {
          response = await browserAPI.getCollections();
        } else {
          const id = url.split('/').pop();
          if (id) {
            response = await browserAPI.getCollection(id);
          }
        }
      } else if (url.includes('/items')) {
        const urlParts = url.split('/');
        const collectionId = urlParts[2];
        response = await browserAPI.getItems(collectionId);
      } else if (url.includes('/tags/keys')) {
        response = await browserAPI.getTagKeys();
      } else if (url.includes('/tags/values')) {
        const key = url.split('/').pop();
        if (key) {
          response = await browserAPI.getTagValues(key);
        }
      }

      if (!response) {
        throw new Error(`Unsupported query endpoint: ${url}`);
      }

      if (!response.ok) {
        if (unauthorizedBehavior === "returnNull" && (response as any).status === 401) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Browser query failed:', error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Force fresh data fetch
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
