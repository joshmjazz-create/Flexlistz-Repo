import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Copy, Search } from 'lucide-react';
import { Input } from './ui/input';
import type { Collection, Item } from '@shared/schema';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCollectionId: string;
}

export default function ImportItemsModal({ isOpen, onClose, targetCollectionId }: ImportItemsModalProps) {
  const [sourceCollectionId, setSourceCollectionId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch all collections for source selection
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
    enabled: isOpen,
  });

  // Fetch items from source collection
  const { data: sourceItems = [] } = useQuery<Item[]>({
    queryKey: [`/api/collections/${sourceCollectionId}/items`],
    enabled: !!sourceCollectionId && isOpen,
  });

  // Filter out the target collection from source options
  const availableCollections = collections.filter(col => col.id !== targetCollectionId);

  // Filter items based on search query
  const filteredItems = sourceItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.composer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.style?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const importItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const response = await fetch(`/api/collections/${targetCollectionId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      if (!response.ok) throw new Error('Failed to import items');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Imported ${data.count} items successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${targetCollectionId}/items`] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      onClose();
      setSelectedItems(new Set());
      setSourceCollectionId('');
      setSearchQuery('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import items",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleImport = () => {
    if (selectedItems.size === 0) return;
    importItemsMutation.mutate(Array.from(selectedItems));
  };

  const handleClose = () => {
    onClose();
    setSelectedItems(new Set());
    setSourceCollectionId('');
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Import Items from Another List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Source Collection Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Source List</label>
            <Select value={sourceCollectionId} onValueChange={setSourceCollectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a list to import from" />
              </SelectTrigger>
              <SelectContent>
                {availableCollections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceCollectionId && (
            <>
              {/* Search and Select All */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={filteredItems.length === 0}
                >
                  {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {sourceItems.length === 0 ? 'No items in this list' : 'No items match your search'}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleItemToggle(item.id)}
                      >
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[
                              { key: "Key", value: item.key },
                              { key: "Composer", value: item.composer },
                              { key: "Style", value: item.style },
                            ]
                              .filter(tag => tag.value?.trim())
                              .map(({ key, value }) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Count */}
              {selectedItems.size > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedItems.size === 0 || importItemsMutation.isPending}
          >
            {importItemsMutation.isPending ? 'Importing...' : `Import ${selectedItems.size} Items`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}