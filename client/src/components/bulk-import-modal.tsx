import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Upload, FileText, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema } from "@shared/schema";

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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemsList: "",
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (items: string[]) => {
      const promises = items.map(async (title) => {
        const itemData = {
          title: title.trim(),
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
      return;
    }
    
    const items = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 100); // Limit to 100 items for performance
    
    setPreviewItems(items);
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
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one item",
        variant: "destructive",
      });
      return;
    }

    if (items.length > 100) {
      toast({
        title: "Error",
        description: "Please limit to 100 items per import",
        variant: "destructive",
      });
      return;
    }

    bulkImportMutation.mutate(items);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setPreviewItems([]);
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
            You can edit each item afterward to add tags and details.
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

                {previewItems.length > 100 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Only the first 100 items will be imported. Please split large lists into smaller batches.
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bulkImportMutation.isPending || previewItems.length === 0}
              >
                {bulkImportMutation.isPending 
                  ? `Importing ${previewItems.length} items...` 
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