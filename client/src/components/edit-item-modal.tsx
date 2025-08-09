import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema, type Item } from "@shared/schema";

const formSchema = insertItemSchema.extend({
  tags: z.record(z.string()).optional(),
});

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
}

const popularTagKeys = ["Style", "Key", "Composer", "Tempo", "Difficulty", "Era", "Genre", "Artist"];

export default function EditItemModal({ open, onOpenChange, item }: EditItemModalProps) {
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      notes: "",
      tags: {},
      collectionId: "",
    },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        title: item.title,
        notes: item.notes || "",
        tags: item.tags || {},
        collectionId: item.collectionId,
      });
    }
  }, [item, open, form]);

  const updateItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("PUT", `/api/items/${item.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateItemMutation.mutate(data);
  };

  const addTag = () => {
    if (newTagKey && newTagValue) {
      const currentTags = form.getValues("tags") || {};
      form.setValue("tags", {
        ...currentTags,
        [newTagKey]: newTagValue,
      });
      setNewTagKey("");
      setNewTagValue("");
    }
  };

  const removeTag = (key: string) => {
    const currentTags = form.getValues("tags") || {};
    const newTags = { ...currentTags };
    delete newTags[key];
    form.setValue("tags", newTags);
  };

  const useTagKey = (key: string) => {
    setNewTagKey(key);
  };

  const currentTags = form.watch("tags") || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Tags</FormLabel>
              
              {/* Existing Tags */}
              {Object.keys(currentTags).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentTags).map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="bg-primary-100 text-primary-800"
                    >
                      {key}: {value}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(key)}
                        className="ml-2 h-auto p-0 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Tag key (e.g., Style, Key, Composer)"
                    value={newTagKey}
                    onChange={(e) => setNewTagKey(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tag value"
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      disabled={!newTagKey || !newTagValue}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Popular Tag Keys */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Popular keys:</p>
                  <div className="flex flex-wrap gap-1">
                    {popularTagKeys.map((key) => (
                      <Button
                        key={key}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => useTagKey(key)}
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {key}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or comments"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateItemMutation.isPending}
              >
                {updateItemMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
