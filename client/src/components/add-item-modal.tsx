import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseMediaLink } from "@/utils/parseMediaLink";
import ItemForm from "./item-form";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
}

export default function AddItemModal({ isOpen, onClose, collectionId }: AddItemModalProps) {
  const { toast } = useToast();

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/items`] });
      onClose();
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (formData: any) => {
    // Parse media URL if provided
    const mediaData = formData.mediaUrl.trim() ? parseMediaLink(formData.mediaUrl) : {};

    createItemMutation.mutate({
      collectionId,
      title: formData.title.trim(),
      key: formData.key.trim() || null,
      composer: formData.composer.trim() || null,
      style: formData.style.trim() || null,
      notes: formData.notes.trim() || null,
      extraTags: formData.extraTags.filter((tag: any) => tag.key.trim() && tag.value.trim()),
      knowledgeLevel: formData.knowledgeLevel || 'does-not-know',
      ...mediaData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <ItemForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={createItemMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}