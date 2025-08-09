import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, List, Grid3X3, ArrowUpAZ, ArrowDownAZ, Filter, Youtube, Music, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Item } from "@shared/schema";
import { YouTubePlayer, SpotifyEmbed } from "./media-player";

interface ItemListProps {
  items: Item[];
  onEditItem: (item: Item) => void;
  isLoading?: boolean;
  viewMode?: 'compact' | 'detailed';
  onViewModeChange?: (mode: 'compact' | 'detailed') => void;
  sortOrder?: 'asc' | 'desc' | 'filter-order' | 'last-modified' | 'first-modified';
  onSortOrderChange?: (order: 'asc' | 'desc' | 'filter-order' | 'last-modified' | 'first-modified') => void;
  hasActiveFilters?: boolean;
  expandedItems?: Set<string>;
  onToggleExpanded?: (itemId: string) => void;

}

const tagColors = [
  "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200", 
  "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200",
  "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200",
  "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
];

export default function ItemList({ 
  items, 
  onEditItem, 
  isLoading, 
  viewMode = 'compact',
  onViewModeChange,
  sortOrder = 'asc',
  onSortOrderChange,
  hasActiveFilters = false,
  expandedItems = new Set(),
  onToggleExpanded
}: ItemListProps) {
  const { toast } = useToast();

  const getKnowledgeClasses = (knowledgeLevel: string | null | undefined) => {
    switch (knowledgeLevel) {
      case 'knows':
        return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
      case 'kind-of-knows':
        return 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-amber-900/20';
      case 'does-not-know':
      default:
        return 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
    }
  };



  const updateKnowledgeMutation = useMutation({
    mutationFn: async ({ id, knowledgeLevel }: { id: string; knowledgeLevel: string }) => {
      await apiRequest("PUT", `/api/items/${id}`, { knowledgeLevel });
    },
    onMutate: async ({ id, knowledgeLevel }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/collections'] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['/api/collections']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['/api/collections'], (old: any) => {
        if (!old) return old;
        return old.map((collection: any) => ({
          ...collection,
          items: collection.items?.map((item: any) => 
            item.id === id ? { ...item, knowledgeLevel } : item
          )
        }));
      });
      
      // Also update items query if it exists
      const itemsQueryKey = ['/api/collections', items[0]?.collectionId, 'items'];
      queryClient.setQueryData(itemsQueryKey, (old: any) => {
        if (!old) return old;
        return old.map((item: any) => 
          item.id === id ? { ...item, knowledgeLevel } : item
        );
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/collections'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
    },
  });



  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or add a new item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Controls Bar */}
      {(onViewModeChange || onSortOrderChange) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-3">
              {onViewModeChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View</span>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('compact')}
                    className="px-3 py-1 text-gray-900 dark:text-gray-100"
                  >
                    <List className="w-4 h-4 mr-1" />
                    Compact
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('detailed')}
                    className="px-3 py-1 text-gray-900 dark:text-gray-100"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Detailed
                  </Button>
                </div>
              )}
              
              {onSortOrderChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort</span>
                  <Button
                    variant={sortOrder === 'asc' || sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1 text-gray-900 dark:text-gray-100"
                  >
                    {sortOrder === 'asc' ? <ArrowDownAZ className="w-4 h-4 mr-1" /> : <ArrowUpAZ className="w-4 h-4 mr-1" />}
                    A-Z
                  </Button>
                  <Button
                    variant={sortOrder === 'last-modified' || sortOrder === 'first-modified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSortOrderChange(sortOrder === 'last-modified' ? 'first-modified' : 'last-modified')}
                    className="px-3 py-1 text-gray-900 dark:text-gray-100"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Last Modified
                    {sortOrder === 'last-modified' ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant={sortOrder === 'filter-order' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSortOrderChange('filter-order')}
                      className="px-3 py-1 text-gray-900 dark:text-gray-100"
                    >
                      <Filter className="w-4 h-4 mr-1" />
                      Filter Order
                    </Button>
                  )}
                </div>
              )}
            </div>


            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {viewMode === 'compact' ? (
          /* Compact View */
          <div className="space-y-1">
            {items.map((item, index) => {
              const isExpanded = expandedItems.has(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`rounded border ${isExpanded ? 'border-blue-300' : ''} hover:shadow-sm transition-shadow ${getKnowledgeClasses(item.knowledgeLevel)}`}
                >
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onToggleExpanded && onToggleExpanded(item.id)}
                      >
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateKnowledgeMutation.mutate({ id: item.id, knowledgeLevel: 'does-not-know' });
                          }}
                          className={`w-4 h-4 rounded border-2 ${
                            item.knowledgeLevel === 'does-not-know' ? 'border-gray-600' : 'border-gray-300'
                          } bg-red-200 hover:border-gray-500 transition-colors`}
                          title="Learning"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateKnowledgeMutation.mutate({ id: item.id, knowledgeLevel: 'kind-of-knows' });
                          }}
                          className={`w-4 h-4 rounded border-2 ${
                            item.knowledgeLevel === 'kind-of-knows' ? 'border-gray-600' : 'border-gray-300'
                          } bg-orange-200 hover:border-gray-500 transition-colors`}
                          title="Kind of Knows"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateKnowledgeMutation.mutate({ id: item.id, knowledgeLevel: 'knows' });
                          }}
                          className={`w-4 h-4 rounded border-2 ${
                            item.knowledgeLevel === 'knows' ? 'border-gray-600' : 'border-gray-300'
                          } bg-green-200 hover:border-gray-500 transition-colors`}
                          title="Knows"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded detailed view - identical to detailed view */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Fixed Fields as Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {[
                              { key: "Key", value: item.key },
                              { key: "Composer", value: item.composer },
                              { key: "Style", value: item.style },
                            ]
                              .filter(tag => tag.value?.trim())
                              .map(({ key, value }, tagIndex) => (
                                <Badge
                                  key={`${key}-${value}`}
                                  variant="secondary"
                                  className={`${tagColors[tagIndex % tagColors.length]} border-0`}
                                >
                                  <span className="text-gray-600 dark:text-gray-400 mr-1">{key}:</span>
                                  {value}
                                </Badge>
                              ))}
                          </div>

                          {/* Media Section */}
                          {(item.youtubeId || item.spotifyUri) && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Media:</span>
                                {item.youtubeId && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800 border-0">
                                    <Youtube className="w-3 h-3 mr-1" />
                                    YouTube
                                  </Badge>
                                )}
                                {item.spotifyUri && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                                    <Music className="w-3 h-3 mr-1" />
                                    Spotify
                                  </Badge>
                                )}
                              </div>
                              
                              {/* YouTube Player */}
                              {item.youtubeId && (
                                <div className="mb-3">
                                  <YouTubePlayer 
                                    videoId={item.youtubeId} 
                                    startSeconds={item.startSeconds || undefined} 
                                  />
                                </div>
                              )}
                              
                              {/* Spotify Player */}
                              {item.spotifyUri && (
                                <div className="mb-3">
                                  <SpotifyEmbed spotifyUri={item.spotifyUri} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                <span className="font-medium">Notes:</span> {item.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditItem(item)}
                            className="p-2 text-gray-400 hover:text-primary-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            disabled={deleteItemMutation.isPending}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Detailed View */
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className={`rounded-lg border p-6 hover:shadow-md transition-shadow ${getKnowledgeClasses(item.knowledgeLevel)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {item.title}
                    </h3>
                    
                    {/* Fixed Fields as Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { key: "Key", value: item.key },
                        { key: "Composer", value: item.composer },
                        { key: "Style", value: item.style },
                      ]
                        .filter(tag => tag.value?.trim())
                        .map(({ key, value }, tagIndex) => (
                          <Badge
                            key={`${key}-${value}`}
                            variant="secondary"
                            className={`${tagColors[tagIndex % tagColors.length]} border-0`}
                          >
                            <span className="text-gray-600 dark:text-gray-400 mr-1">{key}:</span>
                            {value}
                          </Badge>
                        ))}
                    </div>

                    {/* Media Section */}
                    {(item.youtubeId || item.spotifyUri) && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Media:</span>
                          {item.youtubeId && (
                            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-0">
                              <Youtube className="w-3 h-3 mr-1" />
                              YouTube
                            </Badge>
                          )}
                          {item.spotifyUri && (
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-0">
                              <Music className="w-3 h-3 mr-1" />
                              Spotify
                            </Badge>
                          )}
                        </div>
                        
                        {/* YouTube Player */}
                        {item.youtubeId && (
                          <div className="mb-3">
                            <YouTubePlayer 
                              videoId={item.youtubeId} 
                              startSeconds={item.startSeconds || undefined} 
                            />
                          </div>
                        )}
                        
                        {/* Spotify Player */}
                        {item.spotifyUri && (
                          <div className="mb-3">
                            <SpotifyEmbed spotifyUri={item.spotifyUri} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Notes:</span> {item.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      className="p-2 text-gray-400 hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      disabled={deleteItemMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
