import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema, type Item } from "@shared/schema";

const formSchema = z.object({
  itemsList: z.string().min(1, "Please enter at least one item"),
});

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId?: string;
}

export default function BulkImportModal({ open, onOpenChange, collectionId }: BulkImportModalProps) {
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch existing items to check for duplicates
  const { data: existingItems } = useQuery({
    queryKey: ["/api/collections", collectionId, "items"],
    enabled: !!collectionId && open,
  });

  // Re-check duplicates when existing items data changes
  useEffect(() => {
    if (previewItems.length > 0) {
      generatePreview();
    }
  }, [existingItems]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemsList: "",
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (items: string[]) => {
      const promises = items.map(async (title) => {
        let cleanTitle = title.trim();
        // Remove "[  ]" prefix if present
        if (cleanTitle.startsWith('[  ]')) {
          cleanTitle = cleanTitle.substring(4).trim();
        }
        
        const itemData = {
          title: cleanTitle,
          notes: "",
          tags: {},
          collectionId: collectionId!,
        };
        const response = await apiRequest("POST", "/api/items", itemData);
        return response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.length} items`,
      });
      onOpenChange(false);
      form.reset();
      setPreviewItems([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import items",
        variant: "destructive",
      });
    },
  });

  const generatePreview = () => {
    const text = form.getValues("itemsList");
    if (!text.trim()) {
      setPreviewItems([]);
      setDuplicates([]);
      return;
    }
    
    const items = text
      .split('\n')
      .map(line => {
        let trimmed = line.trim();
        // Remove "[  ]" prefix if present
        if (trimmed.startsWith('[  ]')) {
          trimmed = trimmed.substring(4).trim();
        }
        return trimmed;
      })
      .filter(line => line.length > 0)
      .slice(0, 1000); // Limit to 1000 items for performance
    
    setPreviewItems(items);
    
    // Check for duplicates with existing items
    if (existingItems && Array.isArray(existingItems)) {
      const existingTitles = new Set(existingItems.map((item: Item) => item.title.toLowerCase()));
      const duplicateItems = items.filter(item => existingTitles.has(item.toLowerCase()));
      setDuplicates(duplicateItems);
    } else {
      setDuplicates([]);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!collectionId) {
      toast({
        title: "Error",
        description: "Please select a collection first",
        variant: "destructive",
      });
      return;
    }

    const items = data.itemsList
      .split('\n')
      .map(line => {
        let trimmed = line.trim();
        // Remove "[  ]" prefix if present
        if (trimmed.startsWith('[  ]')) {
          trimmed = trimmed.substring(4).trim();
        }
        return trimmed;
      })
      .filter(line => line.length > 0);

    // Filter out duplicates automatically
    const uniqueItems = items.filter(item => !duplicates.map(d => d.toLowerCase()).includes(item.toLowerCase()));

    if (uniqueItems.length === 0) {
      toast({
        title: "Error",
        description: duplicates.length > 0 ? "All items are duplicates - nothing to import" : "Please enter at least one item",
        variant: "destructive",
      });
      return;
    }

    if (items.length > 1000) {
      toast({
        title: "Error",
        description: "Please limit to 1000 items per import",
        variant: "destructive",
      });
      return;
    }

    // Show info about duplicates being skipped
    if (duplicates.length > 0) {
      toast({
        title: "Import Started",
        description: `Importing ${uniqueItems.length} items. Skipped ${duplicates.length} duplicate(s).`,
      });
    }

    bulkImportMutation.mutate(uniqueItems);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setPreviewItems([]);
    setDuplicates([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Items
          </DialogTitle>
          <DialogDescription>
            Paste a list of items (one per line) to quickly populate your collection. 
            Up to 1000 items per import. Duplicate items are prevented, and "[  ]" prefixes are automatically removed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="itemsList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items List</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Enter one item per line, for example:
Misty
Autumn Leaves
Blue Moon
All of Me
Summertime`}
                      rows={10}
                      className="font-mono text-sm"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Generate preview on input change with a slight delay
                        setTimeout(generatePreview, 100);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview Section */}
            {previewItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  Preview ({previewItems.length} items)
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {previewItems.slice(0, 20).map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white text-gray-700"
                      >
                        {item}
                      </Badge>
                    ))}
                    {previewItems.length > 20 && (
                      <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                        +{previewItems.length - 20} more...
                      </Badge>
                    )}
                  </div>
                </div>

                {previewItems.length > 1000 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Only the first 1000 items will be imported. Please split large lists into smaller batches.
                  </div>
                )}

                {duplicates.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <div>
                      <p className="font-medium mb-2">
                        {duplicates.length} duplicate item(s) found:
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {duplicates.slice(0, 5).map((item, index) => (
                          <Badge
                            key={index}
                            variant="destructive"
                            className="bg-red-100 text-red-800 text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                        {duplicates.length > 5 && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                            +{duplicates.length - 5} more...
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs">These duplicates will be automatically skipped during import.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">After importing:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• Items will be created with just titles</li>
                    <li>• Prefixes like "[  ]" are automatically removed</li>
                    <li>• Duplicate titles are blocked to prevent conflicts</li>
                    <li>• Click on any item to edit and add tags (Style, Key, Composer, etc.)</li>
                    <li>• Use the search and filter features to organize your collection</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-gray-900 dark:text-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bulkImportMutation.isPending || previewItems.length === 0}
                className="text-gray-900 dark:text-gray-100"
              >
                {bulkImportMutation.isPending 
                  ? `Importing ${previewItems.length - duplicates.length} items...` 
                  : duplicates.length > 0
                  ? `Remove Duplicates (${previewItems.length - duplicates.length} items)`
                  : `Import ${previewItems.length} Items`
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}