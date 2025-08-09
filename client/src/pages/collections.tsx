import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import CollectionList from "@/components/collection-list";
import ItemList from "@/components/item-list";
import FilterBar from "@/components/filter-bar";
import AddItemModal from "@/components/add-item-modal";
import AddCollectionModal from "@/components/add-collection-modal";
import EditItemModal from "@/components/edit-item-modal";
import FilterModal from "@/components/filter-modal";
import BulkImportModal from "@/components/bulk-import-modal";
import { type Collection, type Item } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Layers, Upload } from "lucide-react";

export default function Collections() {
  const { collectionId } = useParams<{ collectionId?: string }>();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const { data: collections = [] } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
  });

  const activeCollection = collections.find(c => c.id === collectionId);

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/collections", collectionId, "items"],
    enabled: !!collectionId,
  });

  const filteredItems = useQuery<Item[]>({
    queryKey: ["/api/collections", collectionId, "items", { filters: activeFilters, search: searchQuery }],
    enabled: !!collectionId && (Object.keys(activeFilters).length > 0 || searchQuery.length > 0),
  });

  const displayItems = filteredItems.data || items;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Layers className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">FlexList</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Smart Collection Manager</p>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              Collections
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddCollection(true)}
              className="p-1 text-gray-400 hover:text-primary-600"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <CollectionList 
            collections={collections}
            activeCollectionId={collectionId}
          />

          <Button
            variant="outline"
            onClick={() => setShowAddCollection(true)}
            className="w-full mt-4 border-dashed border-2 hover:border-primary-300 hover:text-primary-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeCollection ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {activeCollection.name}
                  </h1>
                  {activeCollection.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {activeCollection.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBulkImport(true)}
                    className="text-gray-600 hover:text-primary-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => setShowAddItem(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onToggleFilters={() => setShowFilters(true)}
            />

            {/* Items List */}
            <ItemList
              items={displayItems}
              onEditItem={setEditingItem}
              isLoading={filteredItems.isLoading}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to FlexList
              </h2>
              <p className="text-gray-500 mb-6">
                Select a collection from the sidebar to get started
              </p>
              <Button onClick={() => setShowAddCollection(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Collection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddItemModal
        open={showAddItem}
        onOpenChange={setShowAddItem}
        collectionId={collectionId}
      />

      <BulkImportModal
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        collectionId={collectionId}
      />

      <AddCollectionModal
        open={showAddCollection}
        onOpenChange={setShowAddCollection}
      />

      {editingItem && (
        <EditItemModal
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
        />
      )}

      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        collectionId={collectionId}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  );
}
