import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, List, Grid3X3, ArrowUpAZ, ArrowDownZA, Filter, Youtube, Music } from "lucide-react";
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
  sortOrder?: 'asc' | 'desc' | 'filter-order';
  onSortOrderChange?: (order: 'asc' | 'desc' | 'filter-order') => void;
  hasActiveFilters?: boolean;
}

const tagColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800", 
  "bg-purple-100 text-purple-800",
  "bg-yellow-100 text-yellow-800",
  "bg-red-100 text-red-800",
  "bg-indigo-100 text-indigo-800",
  "bg-pink-100 text-pink-800",
  "bg-gray-100 text-gray-800"
];

export default function ItemList({ 
  items, 
  onEditItem, 
  isLoading, 
  viewMode = 'detailed',
  onViewModeChange,
  sortOrder = 'asc',
  onSortOrderChange,
  hasActiveFilters = false
}: ItemListProps) {
  const { toast } = useToast();

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
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or add a new item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Controls Bar */}
      {(onViewModeChange || onSortOrderChange) && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-3">
              {onViewModeChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">View</span>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('compact')}
                    className="px-3 py-1"
                  >
                    <List className="w-4 h-4 mr-1" />
                    Compact
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('detailed')}
                    className="px-3 py-1"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Detailed
                  </Button>
                </div>
              )}
              
              {onSortOrderChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Sort</span>
                  <Button
                    variant={sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSortOrderChange('asc')}
                    className="px-3 py-1"
                  >
                    <ArrowUpAZ className="w-4 h-4 mr-1" />
                    A-Z
                  </Button>
                  <Button
                    variant={sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSortOrderChange('desc')}
                    className="px-3 py-1"
                  >
                    <ArrowDownZA className="w-4 h-4 mr-1" />
                    Z-A
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant={sortOrder === 'filter-order' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSortOrderChange('filter-order')}
                      className="px-3 py-1"
                    >
                      <Filter className="w-4 h-4 mr-1" />
                      Filter Order
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'compact' ? (
          /* Compact View */
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900 truncate flex-1">
                    {item.title}
                  </h3>
                  
                  {/* Compact Actions */}
                  <div className="flex space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      disabled={deleteItemMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Detailed View */
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    
                    {/* Tags */}
                    {item.tags && Object.keys(item.tags).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(item.tags).map(([key, value], tagIndex) => (
                          <Badge
                            key={`${key}-${value}`}
                            variant="secondary"
                            className={`${tagColors[tagIndex % tagColors.length]} border-0`}
                          >
                            <span className="text-gray-600 mr-1">{key}:</span>
                            {value}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Media Section */}
                    {(item.youtubeId || item.spotifyUri) && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-700">Media:</span>
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
                      <div className="text-sm text-gray-600">
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
